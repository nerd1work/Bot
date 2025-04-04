// دالة لتحميل لوحة الطالب
async function loadStudentDashboard() {
    const data = await fetchData();
    if (!data) return;
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'student') return;
    
    // حساب الإحصائيات
    const studentRequests = data.requests.filter(r => r.studentId === currentUser.id);
    const pendingCount = studentRequests.filter(r => r.status === 'pending').length;
    const approvedCount = studentRequests.filter(r => r.status === 'approved').length;
    
    // تحديث الإحصائيات
    document.getElementById('my-pending-requests').textContent = pendingCount;
    document.getElementById('my-approved-requests').textContent = approvedCount;
    document.getElementById('my-remaining-requests').textContent = currentUser.remainingRequests || 0;
    
    // تحميل المقررات
    loadStudentCourses(data, currentUser);
}

// دالة لتحميل مقررات الطالب
function loadStudentCourses(data, student) {
    const coursesList = document.getElementById('courses-list');
    if (!coursesList) return;
    
    coursesList.innerHTML = '';
    
    // في نظام حقيقي، هنا سنقوم بمطابقة الطالب مع المقررات المسجل فيها
    // في هذا المثال، سنعرض جميع المقررات المتاحة
    data.courses.forEach(course => {
        const courseElement = document.createElement('div');
        courseElement.className = 'course-item';
        courseElement.innerHTML = `
            <h3>${course.name} (${course.code})</h3>
            <div class="course-details">
                <p><strong>الحد الأدنى:</strong> ${course.minPatients} مرضى</p>
                <p><strong>الحد الأقصى:</strong> ${course.maxPatients} مرضى</p>
            </div>
            <p>${course.description}</p>
        `;
        coursesList.appendChild(courseElement);
    });
}

// تحميل لوحة الطالب عند فتح الصفحة
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('student-name')) {
        loadStudentDashboard();
    }
});