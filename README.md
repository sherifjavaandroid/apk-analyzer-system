# نظام تحليل تكنولوجي متقدم

هذا المشروع هو نظام ويب متكامل لتحليل تطبيقات الـAPK ومستودعات GitHub مع دمج تقنيات الذكاء الاصطناعي لتحليل الثغرات وتوليد التقارير.

## مكونات المشروع

- **الواجهة الأمامية (Frontend):** مبنية بـ React و TypeScript.
- **الخدمات الخلفية (Backend):** خدمات Microservices باستخدام FastAPI (لبعض الخدمات) و Node.js (لبوابة API).
- **البنية التحتية:** Docker، Kubernetes، CI/CD باستخدام GitHub Actions.
- **قاعدة البيانات:** PostgreSQL.

## كيفية التشغيل

1. تشغيل قاعدة البيانات:
   ```bash
   cd database
   docker-compose up -d
