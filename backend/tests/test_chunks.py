from app.services import chunks


def test_page_aware_ids_and_metadata():
    out = chunks.chunk_pages([(1, "hello world"), (2, "second page")], "doc1", "a.pdf", "Math")
    assert [c["id"] for c in out] == ["doc1:1:0", "doc1:2:0"]
    assert out[0]["page_number"] == 1
    assert out[0]["subject"] == "Math"
    assert out[0]["char_count"] == len("hello world")


def test_long_page_splits_with_overlap():
    text = "abcdefghij" * 30  # 300 chars
    out = chunks.chunk_pages([(3, text)], "d", "a.pdf", None, chunk_size=100, overlap=20)
    assert len(out) == 4
    assert all(c["page_number"] == 3 for c in out)
    assert out[1]["text"][:20] == out[0]["text"][-20:]  # overlap preserved


def test_empty_and_none_pages():
    out = chunks.chunk_pages([(1, "   "), (None, "real text")], "d", "a.pdf", None)
    assert len(out) == 1
    assert out[0]["page_number"] is None
    assert out[0]["id"] == "d:x:0"


def test_clean_normalizes_whitespace():
    assert chunks.clean_text("  a\n\t b  ") == "a b"
