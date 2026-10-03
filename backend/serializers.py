from decimal import Decimal

from sqlalchemy.orm import selectinload

from models import Package, Registration
from utils import compute_package_status, row_to_dict

PACKAGE_LOAD = (
    selectinload(Package.itineraries),
    selectinload(Package.facilities),
    selectinload(Package.gallery),
    selectinload(Package.companions),
    selectinload(Package.faqs),
)


def serialize_category(c):
    return row_to_dict(c)


def serialize_package_summary(p: Package):
    d = row_to_dict(p)
    d["remaining_seats"] = max((p.total_seats or 0) - (p.seats_filled or 0), 0)
    d["public_status"] = compute_package_status(p)
    d["category"] = {"id": p.category.id, "name": p.category.name, "slug": p.category.slug, "group_type": p.category.group_type} if p.category else None
    return d


def serialize_package(p: Package):
    d = serialize_package_summary(p)
    d["itineraries"] = [row_to_dict(i) for i in p.itineraries]
    d["facilities_included"] = [f.label for f in p.facilities if f.kind == "INCLUDED"]
    d["facilities_excluded"] = [f.label for f in p.facilities if f.kind == "EXCLUDED"]
    d["gallery"] = [row_to_dict(g) for g in p.gallery]
    d["companions"] = [row_to_dict(c) for c in p.companions]
    d["faqs"] = [row_to_dict(f) for f in p.faqs if f.is_active]
    return d


def serialize_registration(r: Registration, with_payments=False):
    d = row_to_dict(r)
    paid = sum((Decimal(p.amount or 0) for p in r.payments), Decimal(0)) if r.payments is not None else Decimal(0)
    d["total_paid"] = float(paid)
    d["remaining_balance"] = float(Decimal(r.package_price or 0) - paid)
    d["customer"] = row_to_dict(r.customer) if r.customer else None
    d["package_slug"] = r.package.slug if r.package else None
    if with_payments:
        d["payments"] = [row_to_dict(p) for p in r.payments]
    return d


def serialize_article(a, full=False):
    d = row_to_dict(a)
    if not full:
        d.pop("content", None)
    d["category"] = {"id": a.category.id, "name": a.category.name, "slug": a.category.slug} if a.category else None
    d["tags"] = [{"id": t.id, "name": t.name, "slug": t.slug} for t in a.tags]
    return d
