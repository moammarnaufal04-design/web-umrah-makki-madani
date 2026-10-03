from datetime import date, datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegistrationCreate(BaseModel):
    package_id: str
    full_name: str = Field(min_length=2, max_length=150)
    gender: Literal["MALE", "FEMALE"]
    address: str = Field(min_length=3, max_length=500)
    whatsapp: str = Field(min_length=8, max_length=20)
    email: Optional[EmailStr] = None
    plan_month: Optional[str] = Field(default=None, max_length=40)
    notes: Optional[str] = Field(default=None, max_length=1000)
    source_page: Optional[str] = Field(default=None, max_length=500)
    website: Optional[str] = None  # honeypot

    @field_validator("whatsapp")
    @classmethod
    def wa_digits(cls, v):
        digits = "".join(ch for ch in v if ch.isdigit())
        if len(digits) < 9 or len(digits) > 15:
            raise ValueError("Nomor WhatsApp tidak valid")
        return v


class ContactCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    whatsapp: str = Field(min_length=8, max_length=20)
    email: Optional[EmailStr] = None
    subject: Optional[str] = Field(default=None, max_length=200)
    message: str = Field(min_length=5, max_length=2000)
    package_interest: Optional[str] = Field(default=None, max_length=200)
    website: Optional[str] = None


class NewsletterCreate(BaseModel):
    email: EmailStr
    website: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class CategoryIn(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    slug: Optional[str] = None
    group_type: Literal["HAJI", "UMRAH", "WISATA"]
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0


class ReorderIn(BaseModel):
    ids: list[str]


class ItineraryIn(BaseModel):
    day_number: int = 1
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None


class GalleryIn(BaseModel):
    image_url: str
    caption: Optional[str] = None


class CompanionIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    title: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    quote: Optional[str] = None
    profile_lines: list[str] = []


class FaqIn(BaseModel):
    question: str = Field(min_length=3, max_length=400)
    answer: str = Field(min_length=1)
    category: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0
    package_id: Optional[str] = None


class PackageIn(BaseModel):
    name: str = Field(min_length=3, max_length=200)
    slug: Optional[str] = None
    category_id: str
    product_type: Optional[str] = None
    short_description: Optional[str] = Field(default=None, max_length=500)
    full_description: Optional[str] = None
    is_featured: bool = False
    price: float = Field(ge=0)
    dp_amount: float = Field(default=0, ge=0)
    payment_notes: Optional[str] = None
    departure_date: Optional[date] = None
    return_date: Optional[date] = None
    duration_days: Optional[int] = Field(default=None, ge=0)
    departure_airport: Optional[str] = None
    arrival_airport: Optional[str] = None
    airline: Optional[str] = None
    flight_info: Optional[str] = None
    route: Optional[str] = None
    makkah_hotel: Optional[str] = None
    makkah_hotel_rating: Optional[int] = Field(default=None, ge=0, le=5)
    makkah_hotel_distance: Optional[str] = None
    madinah_hotel: Optional[str] = None
    madinah_hotel_rating: Optional[int] = Field(default=None, ge=0, le=5)
    madinah_hotel_distance: Optional[str] = None
    room_type: Optional[str] = None
    other_accommodation: Optional[str] = None
    total_seats: int = Field(default=0, ge=0)
    seats_filled: int = Field(default=0, ge=0)
    limited_threshold: int = Field(default=5, ge=0)
    status_override: Optional[Literal["AVAILABLE", "LIMITED_SEATS", "FULL", "CLOSED", "SOLD_OUT"]] = None
    is_active: bool = True
    is_published: bool = False
    flyer_url: Optional[str] = None
    hero_image_url: Optional[str] = None
    itinerary_file_url: Optional[str] = None
    extra_cities: list[str] = []
    notes: Optional[str] = None
    terms: Optional[str] = None
    booking_cta_label: Optional[str] = None
    whatsapp_cta_label: Optional[str] = None
    whatsapp_message_template: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    itineraries: list[ItineraryIn] = []
    facilities_included: list[str] = []
    facilities_excluded: list[str] = []
    gallery: list[GalleryIn] = []
    companions: list[CompanionIn] = []
    faqs: list[FaqIn] = []


class PackageToggleIn(BaseModel):
    is_published: Optional[bool] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    status_override: Optional[str] = None
    seats_filled: Optional[int] = Field(default=None, ge=0)
    total_seats: Optional[int] = Field(default=None, ge=0)
    price: Optional[float] = Field(default=None, ge=0)
    departure_date: Optional[date] = None


class BulkActionIn(BaseModel):
    ids: list[str]
    action: Literal["publish", "unpublish", "activate", "deactivate", "delete", "feature", "unfeature"]


class RegistrationUpdate(BaseModel):
    full_name: Optional[str] = None
    gender: Optional[Literal["MALE", "FEMALE"]] = None
    address: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[EmailStr] = None
    plan_month: Optional[str] = None
    notes: Optional[str] = None
    package_id: Optional[str] = None
    package_price: Optional[float] = Field(default=None, ge=0)
    dp_amount: Optional[float] = Field(default=None, ge=0)
    status: Optional[Literal["NEW", "CONTACTED", "CONSULTATION", "REGISTERED", "CANCELLED", "COMPLETED"]] = None
    document_status: Optional[Literal["NOT_STARTED", "IN_PROGRESS", "COMPLETE"]] = None
    payment_status: Optional[Literal["UNPAID", "DP_PAID", "PARTIALLY_PAID", "PAID", "OVERDUE"]] = None
    admin_notes: Optional[str] = None


class RegistrationAdminCreate(BaseModel):
    package_id: str
    full_name: str = Field(min_length=2, max_length=150)
    gender: Literal["MALE", "FEMALE"]
    address: Optional[str] = None
    whatsapp: str = Field(min_length=8, max_length=20)
    email: Optional[EmailStr] = None
    status: Literal["NEW", "CONTACTED", "CONSULTATION", "REGISTERED", "CANCELLED", "COMPLETED"] = "NEW"
    admin_notes: Optional[str] = None


class RegistrationBulkIn(BaseModel):
    ids: list[str]
    action: Literal["delete", "set_status"]
    status: Optional[str] = None


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    gender: Optional[Literal["MALE", "FEMALE"]] = None
    address: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[EmailStr] = None
    notes: Optional[str] = None


class PaymentIn(BaseModel):
    registration_id: str
    amount: float = Field(gt=0)
    payment_date: date
    method: Optional[str] = None
    reference: Optional[str] = None
    notes: Optional[str] = None


class PaymentUpdate(BaseModel):
    amount: Optional[float] = Field(default=None, gt=0)
    payment_date: Optional[date] = None
    method: Optional[str] = None
    reference: Optional[str] = None
    notes: Optional[str] = None


class ArticleCategoryIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    slug: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0


class TagIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    slug: Optional[str] = None


class ArticleIn(BaseModel):
    title: str = Field(min_length=3, max_length=250)
    slug: Optional[str] = None
    excerpt: Optional[str] = Field(default=None, max_length=600)
    content: Optional[str] = None
    featured_image_url: Optional[str] = None
    category_id: Optional[str] = None
    author_name: Optional[str] = None
    status: Literal["DRAFT", "PUBLISHED", "SCHEDULED"] = "DRAFT"
    published_at: Optional[datetime] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    is_featured: bool = False
    related_article_ids: list[str] = []
    sources: list[dict[str, Any]] = []
    tag_ids: list[str] = []


class TestimonialIn(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    origin: Optional[str] = None
    package_label: Optional[str] = None
    content: str = Field(min_length=5)
    rating: int = Field(default=5, ge=1, le=5)
    avatar_url: Optional[str] = None
    is_active: bool = True
    is_placeholder: bool = False
    sort_order: int = 0


class HomepageSectionIn(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    content: dict[str, Any] = {}
    is_active: bool = True
    sort_order: Optional[int] = None


class SettingIn(BaseModel):
    value: dict[str, Any]


class AdminUserIn(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=8)


class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = None
    is_active: Optional[bool] = None


class MediaUpdate(BaseModel):
    alt_text: Optional[str] = None
    folder: Optional[str] = None


class ContactStatusIn(BaseModel):
    status: Literal["NEW", "HANDLED"]
