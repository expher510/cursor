# دليل رفع المشروع على GitHub 🚀

## المتطلبات الأساسية

1. **تثبيت Git** (إذا لم يكن مثبتاً):
   - تحميل من: https://git-scm.com/download/win
   - تثبيت Git على Windows

2. **حساب GitHub**:
   - إنشاء حساب على: https://github.com

---

## الخطوات التفصيلية

### الخطوة 1: تثبيت Git (إذا لم يكن مثبتاً)

1. حمّل Git من: https://git-scm.com/download/win
2. ثبت Git مع الإعدادات الافتراضية
3. افتح **Git Bash** أو **PowerShell** جديد

### الخطوة 2: التحقق من تثبيت Git

افتح PowerShell أو Command Prompt واكتب:
```bash
git --version
```

إذا ظهر رقم الإصدار، Git مثبت بنجاح ✅

### الخطوة 3: إعداد Git (للمرة الأولى فقط)

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### الخطوة 4: الانتقال إلى مجلد المشروع

```bash
cd "C:\Users\DELL\OneDrive\Desktop\studio-main"
```

### الخطوة 5: تهيئة Git Repository (إذا لم يكن موجوداً)

```bash
git init
```

### الخطوة 6: إضافة جميع الملفات

```bash
git add .
```

### الخطوة 7: عمل Commit

```bash
git commit -m "Initial commit: LinguaStream - Language learning platform ready for production"
```

### الخطوة 8: إنشاء Repository على GitHub

1. اذهب إلى: https://github.com/new
2. أدخل اسم المشروع (مثلاً: `lingua-stream` أو `studio-main`)
3. اختر **Public** أو **Private**
4. **لا تضع علامة** على "Initialize this repository with a README"
5. اضغط **Create repository**

### الخطوة 9: ربط المشروع المحلي بـ GitHub

بعد إنشاء الـ repository، GitHub سيعطيك رابط. استخدمه في الأمر التالي:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

**مثال:**
```bash
git remote add origin https://github.com/yourusername/lingua-stream.git
```

### الخطوة 10: رفع المشروع

```bash
git branch -M main
git push -u origin main
```

سيطلب منك إدخال:
- **Username**: اسم المستخدم على GitHub
- **Password**: استخدم **Personal Access Token** (ليس كلمة المرور العادية)

---

## إنشاء Personal Access Token (مطلوب)

إذا طلب منك GitHub كلمة مرور، ستحتاج لإنشاء Personal Access Token:

1. اذهب إلى: https://github.com/settings/tokens
2. اضغط **Generate new token** → **Generate new token (classic)**
3. أعطه اسم (مثلاً: "LinguaStream Project")
4. اختر الصلاحيات: ✅ **repo** (كامل)
5. اضغط **Generate token**
6. **انسخ الـ Token** (لن تراه مرة أخرى!)
7. استخدمه كـ password عند `git push`

---

## الأوامر السريعة (ملخص)

```bash
# 1. الانتقال للمشروع
cd "C:\Users\DELL\OneDrive\Desktop\studio-main"

# 2. تهيئة Git (إذا لم يكن موجوداً)
git init

# 3. إضافة الملفات
git add .

# 4. عمل Commit
git commit -m "Initial commit: Production ready"

# 5. ربط بـ GitHub (استبدل بالرابط الصحيح)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 6. رفع المشروع
git branch -M main
git push -u origin main
```

---

## تحديث المشروع لاحقاً

بعد أي تعديلات، استخدم:

```bash
git add .
git commit -m "وصف التعديلات"
git push
```

---

## ملاحظات مهمة ⚠️

### ملفات يجب عدم رفعها (موجودة في .gitignore):
- ✅ `node_modules/` - لا ترفع
- ✅ `.env.local` - لا ترفع (يحتوي على مفاتيح سرية)
- ✅ `.next/` - لا ترفع
- ✅ `.vercel/` - لا ترفع

### ملفات آمنة للرفع:
- ✅ جميع ملفات `src/`
- ✅ `package.json`
- ✅ `README.md`
- ✅ `firestore.rules`
- ✅ `next.config.js`
- ✅ `tsconfig.json`

---

## حل المشاكل الشائعة

### خطأ: "fatal: not a git repository"
```bash
git init
```

### خطأ: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### خطأ: "Authentication failed"
- تأكد من استخدام **Personal Access Token** وليس كلمة المرور
- تأكد من نسخ الـ Token بشكل صحيح

### خطأ: "Permission denied"
- تأكد من أن الـ repository موجود على GitHub
- تأكد من صحة اسم المستخدم والـ repository

---

## بعد الرفع بنجاح ✅

1. اذهب إلى صفحة الـ repository على GitHub
2. تأكد من ظهور جميع الملفات
3. تأكد من ظهور `README.md` في الصفحة الرئيسية
4. يمكنك الآن مشاركة الرابط مع الآخرين!

---

## ربط المشروع بـ Vercel من GitHub

بعد رفع المشروع على GitHub:

1. اذهب إلى: https://vercel.com/new
2. سجل دخول بحساب GitHub
3. اختر المشروع `studio-main` أو `lingua-stream`
4. أضف Environment Variables (كما هو موضح في README.md)
5. اضغط **Deploy**

Vercel سيربط المشروع تلقائياً ويحدثه عند كل push جديد! 🎉

---

## مساعدة إضافية

إذا واجهت أي مشكلة، راجع:
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Vercel Documentation](https://vercel.com/docs)


