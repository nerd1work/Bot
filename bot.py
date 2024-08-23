from instagrapi import Client
import time

# تسجيل الدخول
cl = Client()
username = "jjjhfcv8"  # ضع هنا اسم المستخدم الخاص بك
password = "DrAyHaM212216@@"  # ضع هنا كلمة المرور الخاصة بك
cl.login(username, password)

# معرف المنشور المستهدف (يمكنك الحصول عليه من خلال رابط المنشور)
media_url = "https://www.instagram.com/p/C_Al2zAKWIL/"
media_id = cl.media_id(cl.media_pk_from_url(media_url))

# قائمة لتتبع التعليقات التي تم الرد عليها
replied_comments = []

# الحصول على التعليقات
comments = cl.media_comments(media_id)

# الرد على التعليقات
for comment in comments:
    comment_id = comment.pk
    username = comment.user.username

    # التحقق من إذا كان التعليق قد تم الرد عليه مسبقًا
    if comment_id not in replied_comments:
        try:
            # محاولة وضع إعجاب على التعليق
            cl.comment_like(comment_id)
        except Exception as e:
            print(f"تم تجاوز التعليق بسبب خطأ: {e}")

        # الرد على التعليق كـ "رد" ضمن التعليق نفسه
        try:
            cl.comment_reply(media_id, comment_id, "🤩")
            print(f"تم الرد على التعليق: {comment_id}")
        except Exception as e:
            print(f"فشل الرد على التعليق: {e}")

        # إضافة التعليق إلى قائمة التعليقات التي تم الرد عليها
        replied_comments.append(comment_id)
        time.sleep(20)  # انتظار 20 ثانية بين كل رد لتجنب الحظر
