"""Génération de PDF avec ReportLab (fonctions synchrones, à appeler via run_in_executor)."""
import io
from datetime import datetime


def generate_quote_pdf(q: dict) -> bytes:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, rightMargin=2 * cm, leftMargin=2 * cm,
                            topMargin=2 * cm, bottomMargin=2 * cm)
    gold = colors.HexColor("#D4AF37")
    dark = colors.HexColor("#0A0A0A")
    styles = getSampleStyleSheet()
    elems = []

    elems.append(Paragraph('<font size="22" color="#D4AF37"><b>E3C</b></font>', styles["Normal"]))
    elems.append(Paragraph('<font size="10" color="#666666">Entreprise de Constructions · Guadeloupe · 0690 44 97 14</font>', styles["Normal"]))
    elems.append(Spacer(1, 0.5 * cm))
    elems.append(Paragraph(f'<font size="18"><b>DEVIS {q["quote_number"]}</b></font>', styles["Normal"]))
    elems.append(Spacer(1, 0.3 * cm))

    info = [
        ["Date :", datetime.now().strftime("%d/%m/%Y"), "Client :", q["client_name"]],
        ["Valable jusqu'au :", q.get("valid_until", ""), "Email :", q["client_email"]],
        ["", "", "Téléphone :", q.get("client_phone", "")],
    ]
    t = Table(info, colWidths=[4 * cm, 6 * cm, 4 * cm, 5 * cm])
    t.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), gold),
        ("TEXTCOLOR", (2, 0), (2, -1), gold),
    ]))
    elems.append(t)
    elems.append(Spacer(1, 0.5 * cm))
    elems.append(Paragraph(f'<b>Objet :</b> {q.get("project_description", "")}', styles["Normal"]))
    elems.append(Spacer(1, 0.5 * cm))

    headers = ["Description", "Qté", "Prix HT", "TVA %", "Total HT", "Total TTC"]
    rows = [headers]
    for item in q.get("line_items", []):
        rows.append([
            item["description"], str(item["quantity"]),
            f"{item['unit_price']:.2f} €", f"{item['tva_rate']}%",
            f"{item['total_ht']:.2f} €", f"{item['total_ttc']:.2f} €",
        ])
    lt = Table(rows, colWidths=[7 * cm, 2 * cm, 2.5 * cm, 2 * cm, 2.5 * cm, 3 * cm])
    lt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), dark),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dddddd")),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
    ]))
    elems.append(lt)
    elems.append(Spacer(1, 0.3 * cm))

    totals = [
        ["Total HT :", f"{q['total_ht']:.2f} €"],
        ["TVA :", f"{q['total_tva']:.2f} €"],
        ["TOTAL TTC :", f"{q['total_ttc']:.2f} €"],
    ]
    tt = Table(totals, colWidths=[5 * cm, 3 * cm])
    tt.setStyle(TableStyle([
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("FONTNAME", (0, 2), (-1, 2), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 2), (-1, 2), gold),
        ("TOPPADDING", (0, 2), (-1, 2), 8),
    ]))
    elems.append(HRFlowable(width="100%", color=gold))
    elems.append(Spacer(1, 0.2 * cm))
    wrap = Table([[Spacer(1, 1), tt]], colWidths=["*", 8 * cm])
    elems.append(wrap)

    if q.get("notes"):
        elems.append(Spacer(1, 0.5 * cm))
        elems.append(Paragraph(f'<b>Notes :</b> {q["notes"]}', styles["Normal"]))

    elems.append(Spacer(1, 1 * cm))
    elems.append(Paragraph('<font size="8" color="#999999">E3C Entreprise de Constructions · Guadeloupe (971)</font>', styles["Normal"]))
    doc.build(elems)
    return buf.getvalue()


def generate_invoice_pdf(inv: dict) -> bytes:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, rightMargin=2 * cm, leftMargin=2 * cm,
                            topMargin=2 * cm, bottomMargin=2 * cm)
    gold = colors.HexColor("#D4AF37")
    dark = colors.HexColor("#0A0A0A")
    styles = getSampleStyleSheet()
    elems = []

    elems.append(Paragraph('<font size="22" color="#D4AF37"><b>E3C</b></font>', styles["Normal"]))
    elems.append(Paragraph('<font size="10" color="#666666">Entreprise de Constructions · Guadeloupe · 0690 44 97 14</font>', styles["Normal"]))
    elems.append(Spacer(1, 0.5 * cm))
    elems.append(Paragraph(f'<font size="18"><b>FACTURE {inv["invoice_number"]}</b></font>', styles["Normal"]))
    elems.append(Spacer(1, 0.3 * cm))

    info = [
        ["Facture :", inv["invoice_number"], "Client :", inv["client_name"]],
        ["Devis ref :", inv.get("quote_number", ""), "Email :", inv["client_email"]],
        ["Date :", datetime.now().strftime("%d/%m/%Y"), "Tél :", inv.get("client_phone", "")],
    ]
    t = Table(info, colWidths=[4 * cm, 6 * cm, 4 * cm, 5 * cm])
    t.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), gold),
        ("TEXTCOLOR", (2, 0), (2, -1), gold),
    ]))
    elems.append(t)
    elems.append(Spacer(1, 0.5 * cm))
    elems.append(Paragraph(f'<b>Objet :</b> {inv.get("project_description", "")}', styles["Normal"]))
    elems.append(Spacer(1, 0.5 * cm))

    headers = ["Description", "Qté", "Prix HT", "TVA %", "Total HT", "Total TTC"]
    rows = [headers]
    for item in inv.get("line_items", []):
        rows.append([
            item["description"], str(item["quantity"]),
            f"{item['unit_price']:.2f} €", f"{item['tva_rate']}%",
            f"{item['total_ht']:.2f} €", f"{item['total_ttc']:.2f} €",
        ])
    lt = Table(rows, colWidths=[7 * cm, 2 * cm, 2.5 * cm, 2 * cm, 2.5 * cm, 3 * cm])
    lt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), dark),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dddddd")),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
    ]))
    elems.append(lt)
    elems.append(Spacer(1, 0.3 * cm))

    totals = [
        ["Total HT :", f"{inv['total_ht']:.2f} €"],
        ["TVA :", f"{inv['total_tva']:.2f} €"],
        ["TOTAL TTC :", f"{inv['total_ttc']:.2f} €"],
    ]
    tt = Table(totals, colWidths=[5 * cm, 3 * cm])
    tt.setStyle(TableStyle([
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("FONTNAME", (0, 2), (-1, 2), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 2), (-1, 2), gold),
        ("TOPPADDING", (0, 2), (-1, 2), 8),
    ]))
    elems.append(HRFlowable(width="100%", color=gold))
    elems.append(Spacer(1, 0.2 * cm))
    wrap = Table([[Spacer(1, 1), tt]], colWidths=["*", 8 * cm])
    elems.append(wrap)

    if inv.get("payment_tranches"):
        elems.append(Spacer(1, 0.5 * cm))
        elems.append(Paragraph('<b>Calendrier de règlement :</b>', styles["Normal"]))
        elems.append(Spacer(1, 0.2 * cm))
        tr_rows = [["Tranche", "Montant", "Échéance", "Statut"]]
        for tr in inv["payment_tranches"]:
            status_label = "Payé" if tr["status"] == "paid" else "En attente"
            tr_rows.append([tr["label"], f"{tr['amount']:.2f} €", tr.get("due_date", ""), status_label])
        trt = Table(tr_rows, colWidths=[7 * cm, 3 * cm, 4 * cm, 5 * cm])
        trt.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f0f0f0")),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dddddd")),
        ]))
        elems.append(trt)

    elems.append(Spacer(1, 1 * cm))
    elems.append(Paragraph('<font size="8" color="#999999">E3C Entreprise de Constructions · Guadeloupe (971)</font>', styles["Normal"]))
    doc.build(elems)
    return buf.getvalue()
