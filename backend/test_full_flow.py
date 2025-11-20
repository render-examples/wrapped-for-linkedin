#!/usr/bin/env python3
"""
Test script to verify the entire data flow from file upload to API response.
"""

import asyncio
import json
from pathlib import Path
from src.services.file_service import process_linkedin_file
from src.services.analytics_service import get_engagement_metrics, get_discovery_data
from fastapi import UploadFile

class MockUploadFile:
    """Mock UploadFile for testing"""
    def __init__(self, file_path: Path):
        self.filename = file_path.name
        self.file_path = file_path
        self._content = None

    async def read(self):
        if self._content is None:
            with open(self.file_path, 'rb') as f:
                self._content = f.read()
        return self._content


async def test_flow():
    print("=" * 80)
    print("TESTING FULL DATA FLOW")
    print("=" * 80)

    # Load test file
    test_file = Path("test-data/Content_2024-11-11_2025-11-10_ShifraWilliams.xlsx")

    if not test_file.exists():
        print(f"Error: Test file not found at {test_file}")
        return

    print("\n1. Simulating file upload...")
    mock_file = MockUploadFile(test_file)
    upload_result = await process_linkedin_file(mock_file)
    print(f"   Upload result: {json.dumps(upload_result, indent=2)}")

    file_id = upload_result.get("fileId")
    if not file_id:
        print("   Error: No fileId returned")
        return

    print(f"\n2. Fetching discovery data with fileId: {file_id}")
    discovery = await get_discovery_data(file_id)
    if discovery:
        print(f"   Discovery data: {json.dumps(discovery.dict(), indent=2, default=str)}")
    else:
        print("   Error: No discovery data found")

    print(f"\n3. Fetching engagement metrics with fileId: {file_id}")
    engagement = await get_engagement_metrics(file_id)
    print(f"   Engagement metrics:")
    print(f"     - discovery_data: {json.dumps(engagement.discovery_data, indent=6, default=str)}")
    print(f"     - top_posts: {len(engagement.top_posts or []) if engagement.top_posts else 0} posts")

    print("\n" + "=" * 80)
    print("VERIFICATION CHECKLIST")
    print("=" * 80)

    if discovery:
        print(f"✓ Discovery data retrieved")
        print(f"  - start_date: {discovery.start_date}")
        print(f"  - end_date: {discovery.end_date}")
        print(f"  - total_impressions: {discovery.total_impressions:,}")
        print(f"  - members_reached: {discovery.members_reached:,}")
        print(f"  - total_engagements: {discovery.total_engagements:,}")
        print(f"  - average_impressions_per_day: {discovery.average_impressions_per_day:.1f}")
        print(f"  - new_followers: {discovery.new_followers:,}")
    else:
        print("✗ Discovery data NOT retrieved")

    if engagement and engagement.discovery_data:
        print(f"\n✓ Engagement metrics include discovery_data")
        required_fields = [
            "start_date", "end_date", "total_impressions", "members_reached",
            "total_engagements", "average_impressions_per_day", "new_followers"
        ]
        for field in required_fields:
            value = engagement.discovery_data.get(field)
            status = "✓" if value is not None else "✗"
            print(f"  {status} {field}: {value}")
    else:
        print("✗ Engagement metrics do NOT include discovery_data")

    print("\n" + "=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(test_flow())
