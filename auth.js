// دالة لتسجيل الدخول
async function login(username, password) {
    const data = await fetchData();
    if (!data) return false;
    
    const user = data.users.find(u => u.username === username && u.password === password);
    if (!user) return false;
    
    // حفظ بيانات المستخدم في localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    return true;
}

// دالة لتسجيل الخروج
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// دالة للتحقق من حالة تسجيل الدخول
function checkAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    // عرض اسم المستخدم إذا كان موجوداً
    if (document.getElementById('student-name')) {
        document.getElementById('student-name').textContent = currentUser.name;
    }
    
    // إخفاء الصفحات غير المسموح بها حسب الدور
    const isAdmin = currentUser.role === 'admin';
    const isStudent = currentUser.role === 'student';
    
    if (isStudent && window.location.pathname.includes('admin')) {
        window.location.href = 'student.html';
    }
    
    if (isAdmin && window.location.pathname.includes('student')) {
        window.location.href = 'admin.html';
    }
}

// معالجة نموذج تسجيل الدخول
document.getElementById('login-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const success = await login(username, password);
    if (success) {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (user.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'student.html';
        }
    } else {
        document.getElementById('login-error').textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
    }
});

// التحقق من المصادقة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('index.html')) {
        // إذا كان المستخدم مسجلاً بالفعل، توجيهه للوحة المناسبة
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            if (currentUser.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'student.html';
            }
        }
    } else {
        checkAuth();
    }
});