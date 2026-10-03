import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean, Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Table, Text, func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from database import Base


def gen_id():
    return str(uuid.uuid4())


def now_utc():
    return datetime.now(timezone.utc)


class TimestampMixin:
    created_at = Column(DateTime(timezone=True), default=now_utc, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc, server_default=func.now(), nullable=False)


class AdminUser(Base, TimestampMixin):
    __tablename__ = "admin_users"
    id = Column(String(36), primary_key=True, default=gen_id)
    auth_user_id = Column(String(64), unique=True, nullable=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(150), nullable=True)
    role = Column(String(30), nullable=False, default="SUPER_ADMIN")
    is_active = Column(Boolean, nullable=False, default=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)


class ProductCategory(Base, TimestampMixin):
    __tablename__ = "product_categories"
    id = Column(String(36), primary_key=True, default=gen_id)
    name = Column(String(150), nullable=False)
    slug = Column(String(160), unique=True, nullable=False, index=True)
    group_type = Column(String(20), nullable=False, index=True)  # HAJI | UMRAH | WISATA
    description = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    sort_order = Column(Integer, nullable=False, default=0)
    packages = relationship("Package", back_populates="category")


class Package(Base, TimestampMixin):
    __tablename__ = "packages"
    id = Column(String(36), primary_key=True, default=gen_id)
    code = Column(String(30), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    slug = Column(String(220), unique=True, nullable=False, index=True)
    category_id = Column(String(36), ForeignKey("product_categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    product_type = Column(String(100), nullable=True)
    short_description = Column(String(500), nullable=True)
    full_description = Column(Text, nullable=True)
    is_featured = Column(Boolean, nullable=False, default=False, index=True)
    price = Column(Numeric(14, 2), nullable=False, default=0)
    dp_amount = Column(Numeric(14, 2), nullable=False, default=0)
    payment_notes = Column(Text, nullable=True)
    departure_date = Column(Date, nullable=True, index=True)
    return_date = Column(Date, nullable=True)
    duration_days = Column(Integer, nullable=True)
    departure_airport = Column(String(120), nullable=True)
    arrival_airport = Column(String(120), nullable=True)
    airline = Column(String(120), nullable=True)
    flight_info = Column(Text, nullable=True)
    route = Column(String(120), nullable=True)
    makkah_hotel = Column(String(200), nullable=True)
    makkah_hotel_rating = Column(Integer, nullable=True)
    makkah_hotel_distance = Column(String(120), nullable=True)
    madinah_hotel = Column(String(200), nullable=True)
    madinah_hotel_rating = Column(Integer, nullable=True)
    madinah_hotel_distance = Column(String(120), nullable=True)
    room_type = Column(String(120), nullable=True)
    other_accommodation = Column(Text, nullable=True)
    total_seats = Column(Integer, nullable=False, default=0)
    seats_filled = Column(Integer, nullable=False, default=0)
    limited_threshold = Column(Integer, nullable=False, default=5)
    status_override = Column(String(20), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    is_published = Column(Boolean, nullable=False, default=False, index=True)
    flyer_url = Column(Text, nullable=True)
    hero_image_url = Column(Text, nullable=True)
    itinerary_file_url = Column(Text, nullable=True)
    extra_cities = Column(JSONB, nullable=False, default=list)
    notes = Column(Text, nullable=True)
    terms = Column(Text, nullable=True)
    booking_cta_label = Column(String(80), nullable=True)
    whatsapp_cta_label = Column(String(80), nullable=True)
    whatsapp_message_template = Column(Text, nullable=True)
    seo_title = Column(String(200), nullable=True)
    seo_description = Column(String(320), nullable=True)

    category = relationship("ProductCategory", back_populates="packages", lazy="joined")
    itineraries = relationship("PackageItinerary", back_populates="package", cascade="all, delete-orphan", order_by="PackageItinerary.sort_order")
    facilities = relationship("PackageFacility", back_populates="package", cascade="all, delete-orphan", order_by="PackageFacility.sort_order")
    gallery = relationship("PackageGallery", back_populates="package", cascade="all, delete-orphan", order_by="PackageGallery.sort_order")
    companions = relationship("PackageCompanion", back_populates="package", cascade="all, delete-orphan", order_by="PackageCompanion.sort_order")
    faqs = relationship("Faq", back_populates="package", cascade="all, delete-orphan", order_by="Faq.sort_order")
    registrations = relationship("Registration", back_populates="package")


class PackageItinerary(Base, TimestampMixin):
    __tablename__ = "package_itineraries"
    id = Column(String(36), primary_key=True, default=gen_id)
    package_id = Column(String(36), ForeignKey("packages.id", ondelete="CASCADE"), nullable=False, index=True)
    day_number = Column(Integer, nullable=False, default=1)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)
    package = relationship("Package", back_populates="itineraries")


class PackageFacility(Base, TimestampMixin):
    __tablename__ = "package_facilities"
    id = Column(String(36), primary_key=True, default=gen_id)
    package_id = Column(String(36), ForeignKey("packages.id", ondelete="CASCADE"), nullable=False, index=True)
    kind = Column(String(10), nullable=False, default="INCLUDED")  # INCLUDED | EXCLUDED
    label = Column(String(250), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    package = relationship("Package", back_populates="facilities")


class PackageGallery(Base, TimestampMixin):
    __tablename__ = "package_gallery"
    id = Column(String(36), primary_key=True, default=gen_id)
    package_id = Column(String(36), ForeignKey("packages.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(Text, nullable=False)
    caption = Column(String(250), nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)
    package = relationship("Package", back_populates="gallery")


class PackageCompanion(Base, TimestampMixin):
    __tablename__ = "package_companions"
    id = Column(String(36), primary_key=True, default=gen_id)
    package_id = Column(String(36), ForeignKey("packages.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    title = Column(String(200), nullable=True)
    bio = Column(Text, nullable=True)
    photo_url = Column(Text, nullable=True)
    quote = Column(Text, nullable=True)
    profile_lines = Column(JSONB, nullable=False, default=list)
    sort_order = Column(Integer, nullable=False, default=0)
    package = relationship("Package", back_populates="companions")


class Faq(Base, TimestampMixin):
    __tablename__ = "faqs"
    id = Column(String(36), primary_key=True, default=gen_id)
    package_id = Column(String(36), ForeignKey("packages.id", ondelete="CASCADE"), nullable=True, index=True)
    question = Column(String(400), nullable=False)
    answer = Column(Text, nullable=False)
    category = Column(String(60), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    sort_order = Column(Integer, nullable=False, default=0)
    package = relationship("Package", back_populates="faqs")


class Customer(Base, TimestampMixin):
    __tablename__ = "customers"
    id = Column(String(36), primary_key=True, default=gen_id)
    full_name = Column(String(150), nullable=False)
    gender = Column(String(10), nullable=True)
    address = Column(Text, nullable=True)
    whatsapp = Column(String(25), unique=True, nullable=False, index=True)
    email = Column(String(255), nullable=True, index=True)
    notes = Column(Text, nullable=True)
    registrations = relationship("Registration", back_populates="customer")


class Registration(Base, TimestampMixin):
    __tablename__ = "registrations"
    id = Column(String(36), primary_key=True, default=gen_id)
    code = Column(String(30), unique=True, nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    package_id = Column(String(36), ForeignKey("packages.id", ondelete="SET NULL"), nullable=True, index=True)
    package_name = Column(String(200), nullable=True)
    package_price = Column(Numeric(14, 2), nullable=False, default=0)
    dp_amount = Column(Numeric(14, 2), nullable=False, default=0)
    full_name = Column(String(150), nullable=False)
    gender = Column(String(10), nullable=True)
    address = Column(Text, nullable=True)
    whatsapp = Column(String(25), nullable=False, index=True)
    email = Column(String(255), nullable=True)
    plan_month = Column(String(40), nullable=True)
    notes = Column(Text, nullable=True)
    source_page = Column(String(500), nullable=True)
    status = Column(String(20), nullable=False, default="NEW", index=True)
    document_status = Column(String(20), nullable=False, default="NOT_STARTED", index=True)
    payment_status = Column(String(20), nullable=False, default="UNPAID", index=True)
    admin_notes = Column(Text, nullable=True)
    registered_at = Column(DateTime(timezone=True), default=now_utc, nullable=False, index=True)
    customer = relationship("Customer", back_populates="registrations", lazy="joined")
    package = relationship("Package", back_populates="registrations")
    payments = relationship("Payment", back_populates="registration", cascade="all, delete-orphan", order_by="Payment.payment_date")


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"
    id = Column(String(36), primary_key=True, default=gen_id)
    registration_id = Column(String(36), ForeignKey("registrations.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    package_id = Column(String(36), ForeignKey("packages.id", ondelete="SET NULL"), nullable=True, index=True)
    amount = Column(Numeric(14, 2), nullable=False, default=0)
    payment_date = Column(Date, nullable=False, index=True)
    method = Column(String(60), nullable=True)
    reference = Column(String(120), nullable=True)
    notes = Column(Text, nullable=True)
    recorded_by = Column(String(255), nullable=True)
    registration = relationship("Registration", back_populates="payments")


class ArticleCategory(Base, TimestampMixin):
    __tablename__ = "article_categories"
    id = Column(String(36), primary_key=True, default=gen_id)
    name = Column(String(120), nullable=False)
    slug = Column(String(140), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    sort_order = Column(Integer, nullable=False, default=0)
    articles = relationship("Article", back_populates="category")


class Tag(Base, TimestampMixin):
    __tablename__ = "article_tags"
    id = Column(String(36), primary_key=True, default=gen_id)
    name = Column(String(80), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)


article_tag_links = Table(
    "article_tag_links",
    Base.metadata,
    Column("article_id", String(36), ForeignKey("articles.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", String(36), ForeignKey("article_tags.id", ondelete="CASCADE"), primary_key=True),
)


class Article(Base, TimestampMixin):
    __tablename__ = "articles"
    id = Column(String(36), primary_key=True, default=gen_id)
    title = Column(String(250), nullable=False)
    slug = Column(String(280), unique=True, nullable=False, index=True)
    excerpt = Column(String(600), nullable=True)
    content = Column(Text, nullable=True)
    featured_image_url = Column(Text, nullable=True)
    category_id = Column(String(36), ForeignKey("article_categories.id", ondelete="SET NULL"), nullable=True, index=True)
    author_name = Column(String(150), nullable=True)
    status = Column(String(20), nullable=False, default="DRAFT", index=True)  # DRAFT | PUBLISHED | SCHEDULED
    published_at = Column(DateTime(timezone=True), nullable=True, index=True)
    seo_title = Column(String(200), nullable=True)
    seo_description = Column(String(320), nullable=True)
    is_featured = Column(Boolean, nullable=False, default=False)
    view_count = Column(Integer, nullable=False, default=0)
    related_article_ids = Column(JSONB, nullable=False, default=list)
    sources = Column(JSONB, nullable=False, default=list)
    category = relationship("ArticleCategory", back_populates="articles", lazy="joined")
    tags = relationship("Tag", secondary=article_tag_links, lazy="selectin")


class Media(Base, TimestampMixin):
    __tablename__ = "media"
    id = Column(String(36), primary_key=True, default=gen_id)
    file_name = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=True)
    storage_path = Column(Text, unique=True, nullable=False)
    thumb_path = Column(Text, nullable=True)
    url = Column(Text, nullable=False)
    thumb_url = Column(Text, nullable=True)
    mime_type = Column(String(100), nullable=False)
    size_bytes = Column(Integer, nullable=False, default=0)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    folder = Column(String(60), nullable=False, default="general", index=True)
    alt_text = Column(String(300), nullable=True)
    uploaded_by = Column(String(255), nullable=True)


class Testimonial(Base, TimestampMixin):
    __tablename__ = "testimonials"
    id = Column(String(36), primary_key=True, default=gen_id)
    name = Column(String(150), nullable=False)
    origin = Column(String(150), nullable=True)
    package_label = Column(String(200), nullable=True)
    content = Column(Text, nullable=False)
    rating = Column(Integer, nullable=False, default=5)
    avatar_url = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    is_placeholder = Column(Boolean, nullable=False, default=False)
    sort_order = Column(Integer, nullable=False, default=0)


class HomepageSection(Base, TimestampMixin):
    __tablename__ = "homepage_sections"
    id = Column(String(36), primary_key=True, default=gen_id)
    key = Column(String(60), unique=True, nullable=False, index=True)
    title = Column(String(250), nullable=True)
    subtitle = Column(Text, nullable=True)
    content = Column(JSONB, nullable=False, default=dict)
    is_active = Column(Boolean, nullable=False, default=True)
    sort_order = Column(Integer, nullable=False, default=0)


class SiteSetting(Base):
    __tablename__ = "site_settings"
    key = Column(String(60), primary_key=True)
    value = Column(JSONB, nullable=False, default=dict)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc, server_default=func.now(), nullable=False)


class NewsletterSubscriber(Base, TimestampMixin):
    __tablename__ = "newsletter_subscribers"
    id = Column(String(36), primary_key=True, default=gen_id)
    email = Column(String(255), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, nullable=False, default=True)


class ContactMessage(Base, TimestampMixin):
    __tablename__ = "contact_messages"
    id = Column(String(36), primary_key=True, default=gen_id)
    name = Column(String(150), nullable=False)
    whatsapp = Column(String(25), nullable=False)
    email = Column(String(255), nullable=True)
    subject = Column(String(200), nullable=True)
    message = Column(Text, nullable=False)
    package_interest = Column(String(200), nullable=True)
    status = Column(String(20), nullable=False, default="NEW", index=True)
