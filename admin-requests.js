// دالة لتحميل الطلبات للمسؤول
async function loadAdminRequests() {
    const data = await fetchData();
    if (!data) return;
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'admin') return;
    
    // تحديث معلومات الموافقة
    document.getElementById('approval-limit').textContent = data.settings.adminApprovalLimit;
    document.getElementById('time-window').textContent = 
        data.settings.approvalTimeWindow === 'weekly' ? 'أسبوعية' : 'يومية';
    
    // تحميل عوامل التصفية
    loadFilters(data);
    
    // تحميل الطلبات
    const requestsContainer = document.getElementById('requests-container');
    requestsContainer.innerHTML = '';
    
    const courseFilter = document.getElementById('course-filter').value;
    const studentFilter = document.getElementById('student-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    
    const filteredRequests = data.requests.filter(request => {
        const matchesCourse = !courseFilter || request.courseId == courseFilter;
        const matchesStudent = !studentFilter || request.studentId == studentFilter;
        const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
        
        return matchesCourse && matchesStudent && matchesStatus;
    });
    
    // فرز الطلبات بحيث تكون المعلقة أولاً
    filteredRequests.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        return new Date(b.date) - new Date(a.date);
    });
    
    filteredRequests.forEach(request => {
        const patient = data.patients.find(p => p.id === request.patientId);
        const student = data.users.find(u => u.id === request.studentId);
        const course = data.courses.find(c => c.id === request.courseId);
        
        if (!patient || !student || !course) return;
        
        const requestElement = document.createElement('div');
        requestElement.className = `request-item ${request.status}`;
        requestElement.innerHTML = `
            <div class="request-header">
                <input type="checkbox" class="request-checkbox" data-id="${request.id}" 
                    ${request.status !== 'pending' ? 'disabled' : ''}>
                <span class="request-status status-${request.status}">
                    ${request.status === 'pending' ? 'معلق' : request.status === 'approved' ? 'مقبول' : 'مرفوض'}
                </span>
                <h3>طلب #${request.id}</h3>
            </div>
            <div class="request-details">
                <p><strong>الطالب:</strong> ${student.name}</p>
                <p><strong>المقرر:</strong> ${course.name}</p>
                <p><strong>المريض:</strong> ${patient.name} (${patient.condition})</p>
                <p><strong>التاريخ:</strong> ${request.date}</p>
            </div>
            <div class="request-items">
                <p><strong>المواد المطلوبة:</strong> ${request.items.join('، ')}</p>
            </div>
            ${request.status === 'approved' && request.approvedItems.length > 0 ? `
            <div class="approved-items">
                <p><strong>المواد المعتمدة:</strong> ${request.approvedItems.join('، ')}</p>
            </div>
            ` : ''}
        `;
        
        requestsContainer.appendChild(requestElement);
    });
    
    // إضافة مستمعات الأحداث للعناصر المختارة
    setupCheckboxEvents();
}

// دالة لتحميل عوامل التصفية
function loadFilters(data) {
    const courseFilter = document.getElementById('course-filter');
    const studentFilter = document.getElementById('student-filter');
    
    // تحميل المقررات
    courseFilter.innerHTML = '<option value="">جميع المقررات</option>';
    data.courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = `${course.code} - ${course.name}`;
        courseFilter.appendChild(option);
    });
    
    // تحميل الطلاب
    studentFilter.innerHTML = '<option value="">جميع الطلاب</option>';
    data.users.filter(u => u.role === 'student').forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = student.name;
        studentFilter.appendChild(option);
    });
}

// دالة لإعداد أحداث مربعات الاختيار
function setupCheckboxEvents() {
    const checkboxes = document.querySelectorAll('.request-checkbox');
    const selectAllBtn = document.getElementById('select-all-btn');
    const selectedCount = document.getElementById('selected-count');
    
    // تحديث العدد عند التغيير
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateSelectedCount();
        });
    });
    
    // زر تحديد الكل
    selectAllBtn.addEventListener('click', function() {
        const allChecked = Array.from(checkboxes).every(c => c.checked);
        
        checkboxes.forEach(checkbox => {
            if (!checkbox.disabled) {
                checkbox.checked = !allChecked;
            }
        });
        
        updateSelectedCount();
    });
    
    // زر الموافقة على المحدد
    document.getElementById('approve-selected-btn').addEventListener('click', async function() {
        const selectedIds = getSelectedRequestIds();
        if (selectedIds.length === 0) {
            alert('لم يتم اختيار أي طلبات للموافقة');
            return;
        }
        
        await approveSelectedRequests(selectedIds);
    });
    
    // زر رفض المحدد
    document.getElementById('reject-selected-btn').addEventListener('click', async function() {
        const selectedIds = getSelectedRequestIds();
        if (selectedIds.length === 0) {
            alert('لم يتم اختيار أي طلبات للرفض');
            return;
        }
        
        await rejectSelectedRequests(selectedIds);
    });
}

// دالة لتحديث عدد العناصر المختارة
function updateSelectedCount() {
    const selectedCount = document.getElementById('selected-count');
    const selected = document.querySelectorAll('.request-checkbox:checked').length;
    selectedCount.textContent = `${selected} مختار`;
}

// دالة للحصول على معرفات الطلبات المختارة
function getSelectedRequestIds() {
    const checkboxes = document.querySelectorAll('.request-checkbox:checked');
    return Array.from(checkboxes).map(cb => parseInt(cb.dataset.id));
}

// دالة للموافقة على الطلبات المختارة
async function approveSelectedRequests(requestIds) {
    const data = await fetchData();
    if (!data) return;
    
    // التحقق من عدم تجاوز حد الموافقة
    if (requestIds.length > data.settings.adminApprovalLimit) {
        alert(`لا يمكن الموافقة على أكثر من ${data.settings.adminApprovalLimit} طلب في المرة الواحدة`);
        return;
    }
    
    // تحديث حالة الطلبات
    requestIds.forEach(id => {
        const request = data.requests.find(r => r.id === id);
        if (request) {
            request.status = 'approved';
            request.approvedItems = [...request.items]; // الموافقة على جميع المواد
        }
    });
    
    // حفظ البيانات
    await saveData(data);
    alert('تمت الموافقة على الطلبات المحددة بنجاح');
    loadAdminRequests();
}

// دالة لرفض الطلبات المختارة
async function rejectSelectedRequests(requestIds) {
    const data = await fetchData();
    if (!data) return;
    
    // تحديث حالة الطلبات
    requestIds.forEach(id => {
        const request = data.requests.find(r => r.id === id);
        if (request) {
            request.status = 'rejected';
            request.approvedItems = [];
        }
    });
    
    // حفظ البيانات
    await saveData(data);
    alert('تم رفض الطلبات المحددة بنجاح');
    loadAdminRequests();
}

// تحميل الطلبات عند فتح الصفحة
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('requests-container')) {
        loadAdminRequests();
        
        // إضافة مستمعات الأحداث لعوامل التصفية
        document.getElementById('course-filter').addEventListener('change', loadAdminRequests);
        document.getElementById('student-filter').addEventListener('change', loadAdminRequests);
        document.getElementById('status-filter').addEventListener('change', loadAdminRequests);
    }
});