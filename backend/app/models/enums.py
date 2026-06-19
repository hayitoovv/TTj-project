import enum


class UserRole(str, enum.Enum):
    STUDENT = "student"
    LANDLORD = "landlord"
    CURATOR = "curator"
    ADMIN = "admin"


class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"


class Currency(str, enum.Enum):
    UZS = "UZS"
    USD = "USD"


class HouseStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    RENTED = "rented"
    INACTIVE = "inactive"


class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    ACTIVE = "active"
    ENDED = "ended"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PaymentGateway(str, enum.Enum):
    CLICK = "click"
    PAYME = "payme"
    UZUM = "uzum"
    PAYNET = "paynet"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentPurpose(str, enum.Enum):
    RENT = "rent"
    SERVICE_FEE = "service_fee"
    SUBSCRIPTION = "subscription"


class SubscriptionPlan(str, enum.Enum):
    STUDENT_PRO = "student_pro"
    LANDLORD_PRO = "landlord_pro"
    UNIVERSITY_PRO = "university_pro"


class SubscriptionPeriod(str, enum.Enum):
    MONTHLY = "monthly"
    YEARLY = "yearly"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class ReviewTargetType(str, enum.Enum):
    HOUSE = "house"
    USER = "user"


class ComplaintAgainstType(str, enum.Enum):
    USER = "user"
    HOUSE = "house"


class ComplaintStatus(str, enum.Enum):
    NEW = "new"
    PROCESSING = "processing"
    RESOLVED = "resolved"


class ChatRoomType(str, enum.Enum):
    STUDENT_LANDLORD = "student_landlord"
    STUDENT_CURATOR = "student_curator"
    LANDLORD_CURATOR = "landlord_curator"
    GROUP = "group"


class NotificationType(str, enum.Enum):
    BOOKING = "booking"
    PAYMENT = "payment"
    MESSAGE = "message"
    COMPLAINT = "complaint"
    REVIEW = "review"
    SYSTEM = "system"
