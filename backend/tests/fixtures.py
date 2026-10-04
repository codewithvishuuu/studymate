"""Minimal valid PDFs built with stdlib only (no fixture dependency)."""


def make_pdf(pages: list) -> bytes:
    """pages: list of text strings, one per page. Returns valid single-font PDF bytes."""
    objs: list = []
    n_pages = len(pages)
    # 1: catalog, 2: pages, 3: font, then per page: page obj + content obj
    kids = " ".join(f"{4 + i * 2} 0 R" for i in range(n_pages))
    objs.append("<< /Type /Catalog /Pages 2 0 R >>")
    objs.append(f"<< /Type /Pages /Kids [{kids}] /Count {n_pages} >>")
    objs.append("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    for i, text in enumerate(pages):
        safe = text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        stream = f"BT /F1 12 Tf 72 720 Td ({safe}) Tj ET".encode("latin-1")
        objs.append(f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents {5 + i * 2} 0 R >>")
        objs.append(("stream:\n", stream))
    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for num, body in enumerate(objs, start=1):
        offsets.append(len(out))
        out += f"{num} 0 obj\n".encode("latin-1")
        if isinstance(body, tuple):
            out += f"<< /Length {len(body[1])} >>\nstream\n".encode("latin-1") + body[1] + b"\nendstream\n"
        else:
            out += body.encode("latin-1") + b"\n"
        out += b"endobj\n"
    xref_at = len(out)
    out += f"xref\n0 {len(objs) + 1}\n".encode("latin-1")
    out += b"0000000000 65535 f \n"
    for off in offsets:
        out += f"{off:010d} 00000 n \n".encode("latin-1")
    out += f"trailer\n<< /Size {len(objs) + 1} /Root 1 0 R >>\nstartxref\n{xref_at}\n%%EOF".encode("latin-1")
    return bytes(out)
