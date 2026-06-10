#!/usr/bin/env python3
"""Create a GitHub repository and connect it to a local project directory."""

from __future__ import annotations

import argparse
import re
import shlex
import shutil
import subprocess
import sys
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Sequence, TextIO


REPO_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,98}[a-z0-9])?$")
OWNER_RE = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$")


@dataclass(frozen=True)
class ProjectPlan:
    repo_name: str
    full_repo_name: str
    description: str
    parent_dir: Path
    project_dir: Path
    visibility: str
    owner: Optional[str]
    create_readme: bool
    readme_title: str
    use_existing_dir: bool


def slugify_repo_name(value: str) -> str:
    ascii_value = (
        unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    )
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_value.lower()).strip("-")
    slug = re.sub(r"-{2,}", "-", slug)
    if not slug:
        raise ValueError("empty repository name after normalization")
    validate_repo_name(slug)
    return slug


def validate_repo_name(value: str) -> None:
    if not REPO_RE.fullmatch(value):
        raise ValueError(
            "repository name must use lowercase letters, digits, and hyphens; "
            "start and end with a letter or digit; and be 1-100 characters"
        )


def validate_owner(value: Optional[str]) -> None:
    if value and not OWNER_RE.fullmatch(value):
        raise ValueError(
            "owner must be a GitHub user or organization login using letters, "
            "digits, and hyphens"
        )


def build_plan(
    *,
    repo_name: str,
    description: str,
    parent_dir: Path,
    visibility: str,
    owner: Optional[str],
    create_readme: bool,
    use_existing_dir: bool,
) -> ProjectPlan:
    repo_slug = slugify_repo_name(repo_name)
    validate_owner(owner)
    if visibility not in {"private", "public"}:
        raise ValueError("visibility must be private or public")

    parent = parent_dir.expanduser().resolve()
    project_dir = parent / repo_slug
    if project_dir.exists() and not use_existing_dir:
        raise FileExistsError(
            f"{project_dir} already exists; pass --use-existing-dir to reuse it"
        )

    return ProjectPlan(
        repo_name=repo_slug,
        full_repo_name=f"{owner}/{repo_slug}" if owner else repo_slug,
        description=description.strip(),
        parent_dir=parent,
        project_dir=project_dir,
        visibility=visibility,
        owner=owner,
        create_readme=create_readme,
        readme_title=repo_slug,
        use_existing_dir=use_existing_dir,
    )


def gh_create_command(plan: ProjectPlan) -> list[str]:
    command = [
        "gh",
        "repo",
        "create",
        plan.full_repo_name,
        f"--{plan.visibility}",
    ]
    if plan.description:
        command.extend(["--description", plan.description])
    command.extend(
        [
            "--source",
            str(plan.project_dir),
            "--remote",
            "origin",
            "--push",
        ]
    )
    return command


def format_command(command: Sequence[str]) -> str:
    return shlex.join(command)


def repo_lookup_name(plan: ProjectPlan, *, authenticated_owner: str) -> str:
    return plan.full_repo_name if plan.owner else f"{authenticated_owner}/{plan.repo_name}"


def authenticated_owner() -> str:
    result = subprocess.run(
        ["gh", "api", "user", "--jq", ".login"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        check=True,
    )
    owner = result.stdout.strip()
    if not owner:
        raise RuntimeError("could not determine authenticated GitHub user")
    return owner


def github_repo_exists(repository: str) -> bool:
    result = subprocess.run(
        ["gh", "repo", "view", repository, "--json", "name"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    return result.returncode == 0


def print_dry_run(plan: ProjectPlan, stdout: TextIO) -> None:
    print(
        "DRY RUN: no files, commits, remotes, or GitHub repositories were changed.",
        file=stdout,
    )
    print(f"Project directory: {plan.project_dir}", file=stdout)
    print(f"Repository: {plan.full_repo_name}", file=stdout)
    print(f"Visibility: {plan.visibility}", file=stdout)
    print("Commands:", file=stdout)
    print(f"  mkdir -p {shlex.quote(str(plan.project_dir))}", file=stdout)
    print(f"  cd {shlex.quote(str(plan.project_dir))}", file=stdout)
    print("  git init -b main", file=stdout)
    if plan.create_readme:
        print("  write README.md", file=stdout)
        print("  git add README.md", file=stdout)
        print("  git commit -m 'Initial commit'", file=stdout)
    print(f"  {format_command(gh_create_command(plan))}", file=stdout)


def require_tool(name: str) -> None:
    if not shutil.which(name):
        raise RuntimeError(f"required command not found: {name}")


def run(command: Sequence[str], *, cwd: Path, stdout: TextIO) -> None:
    print(f"$ {format_command(command)}", file=stdout)
    subprocess.run(command, cwd=str(cwd), check=True)


def git_has_commits(project_dir: Path) -> bool:
    result = subprocess.run(
        ["git", "rev-parse", "--verify", "HEAD"],
        cwd=str(project_dir),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    return result.returncode == 0


def write_readme(plan: ProjectPlan) -> bool:
    readme = plan.project_dir / "README.md"
    if readme.exists():
        return False

    body = f"# {plan.readme_title}\n"
    if plan.description:
        body += f"\n{plan.description}\n"
    readme.write_text(body, encoding="utf-8")
    return True


def execute_plan(plan: ProjectPlan, *, stdout: TextIO) -> None:
    require_tool("git")
    require_tool("gh")

    subprocess.run(["gh", "auth", "status"], check=True)
    lookup_name = repo_lookup_name(
        plan, authenticated_owner=plan.owner or authenticated_owner()
    )
    if github_repo_exists(lookup_name):
        raise RuntimeError(f"GitHub repository already exists: {lookup_name}")

    plan.project_dir.mkdir(parents=True, exist_ok=plan.use_existing_dir)

    if not (plan.project_dir / ".git").exists():
        try:
            run(["git", "init", "-b", "main"], cwd=plan.project_dir, stdout=stdout)
        except subprocess.CalledProcessError:
            run(["git", "init"], cwd=plan.project_dir, stdout=stdout)

    readme_written = write_readme(plan) if plan.create_readme else False
    if not git_has_commits(plan.project_dir):
        if not readme_written and not (plan.project_dir / "README.md").exists():
            raise RuntimeError(
                "cannot push an empty repository; omit --no-readme or create a commit first"
            )
        run(["git", "add", "README.md"], cwd=plan.project_dir, stdout=stdout)
        run(
            ["git", "commit", "-m", "Initial commit"],
            cwd=plan.project_dir,
            stdout=stdout,
        )

    run(gh_create_command(plan), cwd=plan.project_dir, stdout=stdout)
    print(
        f"Created and connected {plan.full_repo_name} at {plan.project_dir}",
        file=stdout,
    )


def parse_args(argv: Optional[Sequence[str]]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create a GitHub repository and connect it to a local project directory."
    )
    parser.add_argument("--description", required=True, help="Project description")
    parser.add_argument(
        "--repo-name",
        required=True,
        help="Kebab-case repository/project name chosen from the description",
    )
    parser.add_argument(
        "--parent-dir",
        default=".",
        type=Path,
        help="Directory where the project directory should be created",
    )
    parser.add_argument(
        "--owner",
        help="GitHub user or organization. Omit to use the authenticated personal account.",
    )
    parser.add_argument(
        "--visibility",
        choices=("private", "public"),
        default="private",
        help="GitHub repository visibility",
    )
    parser.add_argument(
        "--no-readme",
        action="store_true",
        help="Do not create README.md before the initial commit",
    )
    parser.add_argument(
        "--use-existing-dir",
        action="store_true",
        help="Reuse an existing local project directory with the same repo name",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print planned filesystem, git, and gh actions without executing them",
    )
    return parser.parse_args(argv)


def main(
    argv: Optional[Sequence[str]] = None,
    *,
    stdout: TextIO = sys.stdout,
    stderr: TextIO = sys.stderr,
) -> int:
    args = parse_args(argv)
    try:
        plan = build_plan(
            repo_name=args.repo_name,
            description=args.description,
            parent_dir=args.parent_dir,
            visibility=args.visibility,
            owner=args.owner,
            create_readme=not args.no_readme,
            use_existing_dir=args.use_existing_dir,
        )
        if args.dry_run:
            print_dry_run(plan, stdout)
        else:
            execute_plan(plan, stdout=stdout)
        return 0
    except (
        FileExistsError,
        RuntimeError,
        ValueError,
        subprocess.CalledProcessError,
    ) as exc:
        print(f"ERROR: {exc}", file=stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
