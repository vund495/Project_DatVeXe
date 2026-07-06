import logging
import os

from google import genai
from google.genai import types

from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "Bạn là trợ lý AI thông minh tích hợp trên VietRide X - Nền tảng đặt vé xe khách tương lai tại Việt Nam. "
    "Hãy trả lời câu hỏi của khách hàng bằng tiếng Việt, ngắn gọn, thân thiện, và hữu ích. "
    "Các tuyến phổ biến của chúng tôi gồm: TP.HCM đi Đà Lạt, Nha Trang, Đà Nẵng, Vũng Tàu; Hà Nội đi Sa Pa, Hải Phòng. "
    "Nhà xe đối tác gồm: Phương Trang (FUTA Bus Lines), Thành Bưởi Limousine, Sao Việt Premium, Hải Vân Express, Toàn Thắng Limousine."
)


def generate_reply(user_message: str) -> str:
    api_key = settings.gemini_api_key
    if not api_key or api_key == "YOUR_GEMINI_API_KEY":
        return _local_fallback(user_message)

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=[SYSTEM_PROMPT + "\n\nCâu hỏi khách hàng: " + user_message],
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=512,
            ),
        )
        if response.text:
            return response.text.strip()
    except Exception as e:
        logger.warning("Gemini API call failed: %s", e)

    return _local_fallback(user_message)


def _local_fallback(message: str) -> str:
    msg = message.lower()
    routes = {
        ("đà lạt", "da lat"): "Tuyến TP. Hồ Chí Minh đi Đà Lạt hiện có các chuyến khởi hành lúc 07:00 (Phương Trang, xe Sleeper 34, giá 300.000đ) và 22:00 (Thành Bưởi Limousine, xe Cabin 24, giá 420.000đ). Thời gian di chuyển khoảng 7 tiếng. Bạn có thể sử dụng khung tìm kiếm ở trên để đặt vé ngay!",
        ("sa pa", "sapa"): "Tuyến Hà Nội đi Sa Pa dài 320km đi mất khoảng 6 tiếng. Chúng tôi có xe Sao Việt khởi hành lúc 06:30 (giá 320.000đ) và xe Hải Vân Express lúc 22:00 (giá 450.000đ). Trải nghiệm cabin riêng cực kỳ thoải mái và sang trọng!",
        ("hải phòng", "hai phong"): "Tuyến Hà Nội đi Hải Phòng chạy đường cao tốc cực nhanh chỉ 2 tiếng. Có xe Hải Vân Express lúc 09:30 (220.000đ) và xe Toàn Thắng Limousine lúc 14:00 (160.000đ). Rất tiện lợi và đúng giờ!",
        ("nha trang",): "Tuyến TP. Hồ Chí Minh đi Nha Trang khởi hành tối lúc 20:30 (Phương Trang, 350.000đ) và 21:30 (Thành Bưởi, 480.000đ), giúp bạn ngủ một giấc sáng mai là đến nơi để đi biển ngay.",
        ("đà nẵng", "da nang"): "Tuyến TP. Hồ Chí Minh đi Đà Nẵng khởi hành lúc 08:00 (Phương Trang Sleeper, 450.000đ) và 17:30 (Thành Bưởi Cabin, 650.000đ). Thời gian di chuyển khoảng 18 tiếng.",
    }
    for keywords, reply in routes.items():
        if any(kw in msg for kw in keywords):
            return reply

    if any(kw in msg for kw in ("giá vé", "gia ve", "bao nhiêu", "bao nhieu", "tiền", "tien")):
        return "Giá vé xe tại VietRide X dao động từ 160.000đ đến 650.000đ tùy theo cự ly và hạng xe (Ghế ngồi, Giường nằm Sleeper 34, hoặc Cabin Limousine cao cấp). Vui lòng nhập điểm đi/điểm đến ở bảng tìm kiếm để biết giá chính xác của từng chuyến."
    if any(kw in msg for kw in ("hủy", "huy", "đổi", "doi", "chính sách", "chinh sach")):
        return "Chính sách hủy/đổi vé tại VietRide X:\n- Hủy trước giờ khởi hành > 24 giờ: Phí hủy là 10% giá vé.\n- Hủy trong vòng 24 giờ trước giờ khởi hành: Không hỗ trợ hoàn tiền.\nBạn vui lòng liên hệ hotline 1900-VIETRIDE để được hỗ trợ gấp."
    if any(kw in msg for kw in ("thanh toán", "thanh toan", "momo", "chuyển khoản", "chuyen khoan")):
        return "Chúng tôi hỗ trợ nhiều phương thức thanh toán an toàn bao gồm: Ví điện tử MoMo, ZaloPay, Thẻ nội địa ATM và Chuyển khoản ngân hàng qua mã VietQR (giả lập thanh toán nhanh tức thì)."
    return "Chào bạn! Tôi là trợ lý ảo VietRide AI. Tôi có thể giúp bạn tìm kiếm các chuyến xe (như Hồ Chí Minh đi Đà Lạt, Nha Trang, Đà Nẵng; Hà Nội đi Sa Pa, Hải Phòng), cung cấp giá vé, lịch trình và tư vấn chính sách đặt vé. Bạn muốn đi đâu thế?"
