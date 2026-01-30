import unittest
import os
import sys
import tempfile
import shutil
from pathlib import Path

# Add the project root to sys.path to allow imports from edge_agent
repo_root = Path(__file__).resolve().parents[3]
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from edge_agent.app.indexing.indexer import perform_indexing_scan, reset_indexing_stats
from edge_agent.app.indexing.scan_rules import normalize_root_path, compute_repo_id

class TestIndexerTraversal(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.root_path = normalize_root_path(self.test_dir)
        self.repo_id = compute_repo_id(self.root_path)
        reset_indexing_stats()

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_traversal_skips_excluded_directories(self):
        # Create a structure with allowed and excluded directories
        os.makedirs(os.path.join(self.test_dir, "src"))
        os.makedirs(os.path.join(self.test_dir, ".git"))
        os.makedirs(os.path.join(self.test_dir, "node_modules"))
        
        # Create files in each
        Path(os.path.join(self.test_dir, "src", "main.py")).touch()
        Path(os.path.join(self.test_dir, ".git", "config")).touch()
        Path(os.path.join(self.test_dir, "node_modules", "package.json")).touch()
        Path(os.path.join(self.test_dir, "README.md")).touch()

        results = perform_indexing_scan(self.test_dir, self.repo_id)
        
        # main.py and README.md should be indexed (2 files)
        # .git and node_modules should be skipped (2 directories)
        self.assertEqual(results["indexed_files"], 2)
        self.assertEqual(results["skipped_files"], 2)

    def test_traversal_skips_excluded_extensions(self):
        # Create allowed and excluded files
        Path(os.path.join(self.test_dir, "script.py")).touch()
        Path(os.path.join(self.test_dir, "image.png")).touch()
        Path(os.path.join(self.test_dir, "archive.zip")).touch()
        Path(os.path.join(self.test_dir, "notes.txt")).touch()

        results = perform_indexing_scan(self.test_dir, self.repo_id)
        
        # script.py and notes.txt should be indexed (2 files)
        # image.png and archive.zip should be skipped (2 files)
        self.assertEqual(results["indexed_files"], 2)
        self.assertEqual(results["skipped_files"], 2)

    def test_traversal_case_insensitivity(self):
        # Create directories and files with uppercase excluded names
        os.makedirs(os.path.join(self.test_dir, ".GIT"))
        Path(os.path.join(self.test_dir, "PHOTO.JPG")).touch()
        Path(os.path.join(self.test_dir, "allowed.py")).touch()

        results = perform_indexing_scan(self.test_dir, self.repo_id)
        
        # allowed.py should be indexed (1 file)
        # .GIT and PHOTO.JPG should be skipped (2 items)
        self.assertEqual(results["indexed_files"], 1)
        self.assertEqual(results["skipped_files"], 2)

if __name__ == "__main__":
    unittest.main()
