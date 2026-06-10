import io
import tempfile
import unittest
from pathlib import Path

import create_github_project as subject


class CreateGitHubProjectTest(unittest.TestCase):
    def test_slugify_repo_name_uses_kebab_case(self):
        self.assertEqual(
            subject.slugify_repo_name("AI Contract Review Tool"),
            "ai-contract-review-tool",
        )
        self.assertEqual(
            subject.slugify_repo_name("  GitHub Repo_Bootstrap!! "),
            "github-repo-bootstrap",
        )

        with self.assertRaisesRegex(ValueError, "empty repository name"):
            subject.slugify_repo_name("!!!")

    def test_build_plan_targets_owner_repo_and_project_directory(self):
        with tempfile.TemporaryDirectory() as tmp:
            plan = subject.build_plan(
                repo_name="invoice-tracker",
                description="Track invoice status and payment reminders",
                parent_dir=Path(tmp),
                visibility="private",
                owner="alice",
                create_readme=True,
                use_existing_dir=False,
            )

            self.assertEqual(plan.repo_name, "invoice-tracker")
            self.assertEqual(plan.full_repo_name, "alice/invoice-tracker")
            self.assertEqual(plan.project_dir, Path(tmp).resolve() / "invoice-tracker")
            self.assertEqual(plan.readme_title, "invoice-tracker")

    def test_dry_run_prints_commands_without_creating_directory(self):
        with tempfile.TemporaryDirectory() as tmp:
            stdout = io.StringIO()
            rc = subject.main(
                [
                    "--description",
                    "Track invoice status and payment reminders",
                    "--repo-name",
                    "invoice-tracker",
                    "--owner",
                    "alice",
                    "--parent-dir",
                    tmp,
                    "--dry-run",
                ],
                stdout=stdout,
            )

            self.assertEqual(rc, 0)
            self.assertFalse((Path(tmp) / "invoice-tracker").exists())
            output = stdout.getvalue()
            self.assertIn("DRY RUN", output)
            self.assertIn("gh repo create alice/invoice-tracker --private", output)
            self.assertIn(str(Path(tmp).resolve() / "invoice-tracker"), output)

    def test_existing_directory_requires_explicit_reuse(self):
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp) / "invoice-tracker").mkdir()

            with self.assertRaisesRegex(FileExistsError, "--use-existing-dir"):
                subject.build_plan(
                    repo_name="invoice-tracker",
                    description="Track invoice status and payment reminders",
                    parent_dir=Path(tmp),
                    visibility="private",
                    owner=None,
                    create_readme=True,
                    use_existing_dir=False,
                )

    def test_repo_lookup_uses_authenticated_owner_when_owner_is_omitted(self):
        with tempfile.TemporaryDirectory() as tmp:
            plan = subject.build_plan(
                repo_name="invoice-tracker",
                description="Track invoice status and payment reminders",
                parent_dir=Path(tmp),
                visibility="private",
                owner=None,
                create_readme=True,
                use_existing_dir=False,
            )

            self.assertEqual(
                subject.repo_lookup_name(plan, authenticated_owner="alice"),
                "alice/invoice-tracker",
            )


if __name__ == "__main__":
    unittest.main()
