// EmPay HRMS — Mock Data Layer
// Each export maps 1-to-1 with a service in src/services/
// Swap USE_MOCK=false in each service when backend is ready.

export const ROLES = {
  ADMIN:   'admin',
  HR:      'hr_officer',
  PAYROLL: 'payroll_officer',
  EMPLOYEE:'employee',
};

export const STATUS_SYMBOLS = {
  present:   { symbol: '✅', label: 'Present',    badge: 'badge-present'   },
  absent:    { symbol: '❌', label: 'Absent',     badge: 'badge-absent'    },
  late:      { symbol: '⚠️', label: 'Late',       badge: 'badge-late'      },
  pending:   { symbol: '🕐', label: 'Pending',    badge: 'badge-pending'   },
  approved:  { symbol: '✓',  label: 'Approved',   badge: 'badge-approved'  },
  rejected:  { symbol: '✗',  label: 'Rejected',   badge: 'badge-rejected'  },
  active:    { symbol: '✅', label: 'Active',     badge: 'badge-active'    },
  inactive:  { symbol: '❌', label: 'Inactive',   badge: 'badge-inactive'  },
  processed: { symbol: '✓',  label: 'Processed',  badge: 'badge-processed' },
  draft:     { symbol: '○',  label: 'Draft',      badge: 'badge-draft'     },
  paid:      { symbol: '✅', label: 'Paid',       badge: 'badge-paid'      },
};

// ─── Demo users for login role-switcher ────────────────────────────────────
export const DEMO_USERS = [
  { id:'usr_admin',   name:'Arjun Sharma',  email:'admin@acmecorp.com',   role:ROLES.ADMIN,   company:'Acme Corp', avatar:'AS', photoColor:'#6366f1', designation:'Chief HR Admin',   department:'Administration', managerId:null,      hasBankDetails:true,  daysPresent:20, empCode:'ADM001' },
  { id:'usr_hr',      name:'Rahul Verma',   email:'hr@acmecorp.com',      role:ROLES.HR,      company:'Acme Corp', avatar:'RV', photoColor:'#10b981', designation:'HR Manager',        department:'HR',            managerId:'usr_admin', hasBankDetails:true,  daysPresent:18, empCode:'EMP002' },
  { id:'usr_payroll', name:'Sneha Patel',   email:'payroll@acmecorp.com', role:ROLES.PAYROLL, company:'Acme Corp', avatar:'SP', photoColor:'#f59e0b', designation:'Payroll Analyst',  department:'Finance',       managerId:'usr_admin', hasBankDetails:true,  daysPresent:19, empCode:'EMP003' },
  { id:'usr_emp',     name:'Priya Mehta',   email:'priya@acmecorp.com',   role:ROLES.EMPLOYEE,company:'Acme Corp', avatar:'PM', photoColor:'#ec4899', designation:'Software Engineer', department:'Engineering',   managerId:'usr_hr',   hasBankDetails:false, daysPresent:18, empCode:'EMP001' },
];

// Mutable current user — updated on login
export let currentUser = DEMO_USERS[0];
export function setCurrentUser(user) { currentUser = user; }

// ─── Employees ──────────────────────────────────────────────────────────────
export const employees = [
  { id:'emp_001', code:'EMP001', name:'Priya Mehta',  email:'priya@acme.com',   role:ROLES.EMPLOYEE, designation:'Software Engineer', department:'Engineering', status:'active',   joined:'2023-03-15', phone:'+91 98765 43210', managerId:'emp_002', hasBankDetails:false, photoColor:'#ec4899', daysPresent:18 },
  { id:'emp_002', code:'EMP002', name:'Rahul Verma',  email:'rahul@acme.com',   role:ROLES.HR,       designation:'HR Manager',        department:'HR',          status:'active',   joined:'2022-07-01', phone:'+91 98765 43211', managerId:null,      hasBankDetails:true,  photoColor:'#10b981', daysPresent:20 },
  { id:'emp_003', code:'EMP003', name:'Sneha Patel',  email:'sneha@acme.com',   role:ROLES.PAYROLL,  designation:'Payroll Analyst',   department:'Finance',     status:'active',   joined:'2021-11-20', phone:'+91 98765 43212', managerId:'emp_002', hasBankDetails:true,  photoColor:'#f59e0b', daysPresent:19 },
  { id:'emp_004', code:'EMP004', name:'Karan Singh',  email:'karan@acme.com',   role:ROLES.EMPLOYEE, designation:'UI/UX Designer',    department:'Design',      status:'active',   joined:'2024-01-10', phone:'+91 98765 43213', managerId:'emp_002', hasBankDetails:true,  photoColor:'#8b5cf6', daysPresent:17 },
  { id:'emp_005', code:'EMP005', name:'Anjali Gupta', email:'anjali@acme.com',  role:ROLES.EMPLOYEE, designation:'Data Analyst',      department:'Analytics',   status:'inactive', joined:'2023-06-05', phone:'+91 98765 43214', managerId:null,      hasBankDetails:false, photoColor:'#06b6d4', daysPresent:0  },
  { id:'emp_006', code:'EMP006', name:'Vikram Nair',  email:'vikram@acme.com',  role:ROLES.EMPLOYEE, designation:'Backend Developer', department:'Engineering', status:'active',   joined:'2022-09-12', phone:'+91 98765 43215', managerId:'emp_002', hasBankDetails:true,  photoColor:'#3b82f6', daysPresent:21 },
  { id:'emp_007', code:'EMP007', name:'Meera Joshi',  email:'meera@acme.com',   role:ROLES.EMPLOYEE, designation:'Product Manager',   department:'Product',     status:'active',   joined:'2023-01-18', phone:'+91 98765 43216', managerId:'emp_002', hasBankDetails:true,  photoColor:'#f97316', daysPresent:16 },
  { id:'emp_008', code:'EMP008', name:'Amit Rawat',   email:'amit@acme.com',    role:ROLES.EMPLOYEE, designation:'DevOps Engineer',   department:'Engineering', status:'active',   joined:'2024-03-22', phone:'+91 98765 43217', managerId:null,      hasBankDetails:true,  photoColor:'#14b8a6', daysPresent:15 },
];

// ─── Today's attendance board (all employees) ───────────────────────────────
export const todayAttendance = [
  { employeeId:'emp_001', name:'Priya Mehta',  avatar:'PM', photoColor:'#ec4899', designation:'Software Engineer', department:'Engineering', checkIn:'09:02 AM', checkOut:null,      status:'present'  },
  { employeeId:'emp_002', name:'Rahul Verma',  avatar:'RV', photoColor:'#10b981', designation:'HR Manager',        department:'HR',          checkIn:'08:55 AM', checkOut:null,      status:'present'  },
  { employeeId:'emp_003', name:'Sneha Patel',  avatar:'SP', photoColor:'#f59e0b', designation:'Payroll Analyst',   department:'Finance',     checkIn:'09:30 AM', checkOut:null,      status:'late'     },
  { employeeId:'emp_004', name:'Karan Singh',  avatar:'KS', photoColor:'#8b5cf6', designation:'UI/UX Designer',    department:'Design',      checkIn:'09:05 AM', checkOut:null,      status:'present'  },
  { employeeId:'emp_005', name:'Anjali Gupta', avatar:'AG', photoColor:'#06b6d4', designation:'Data Analyst',      department:'Analytics',   checkIn:null,       checkOut:null,      status:'absent'   },
  { employeeId:'emp_006', name:'Vikram Nair',  avatar:'VN', photoColor:'#3b82f6', designation:'Backend Developer', department:'Engineering', checkIn:'08:50 AM', checkOut:null,      status:'present'  },
  { employeeId:'emp_007', name:'Meera Joshi',  avatar:'MJ', photoColor:'#f97316', designation:'Product Manager',   department:'Product',     checkIn:'09:15 AM', checkOut:null,      status:'present'  },
  { employeeId:'emp_008', name:'Amit Rawat',   avatar:'AR', photoColor:'#14b8a6', designation:'DevOps Engineer',   department:'Engineering', checkIn:null,       checkOut:null,      status:'absent'   },
];

// ─── Departments ─────────────────────────────────────────────────────────────
export const departments = [
  { id:'dep_001', name:'Engineering',  description:'Software development and infrastructure', count:3 },
  { id:'dep_002', name:'HR',           description:'Human resources and people operations',   count:1 },
  { id:'dep_003', name:'Finance',      description:'Payroll, accounting and financial ops',   count:1 },
  { id:'dep_004', name:'Design',       description:'UI/UX and brand design',                  count:1 },
  { id:'dep_005', name:'Analytics',    description:'Data and business intelligence',           count:1 },
  { id:'dep_006', name:'Product',      description:'Product management and roadmap',           count:1 },
];

// ─── Leave ───────────────────────────────────────────────────────────────────
export const leaveTypes = [
  { id:'lt_001', name:'Annual Leave',    isPaid:true,  maxDaysPerYear:15 },
  { id:'lt_002', name:'Sick Leave',      isPaid:true,  maxDaysPerYear:10 },
  { id:'lt_003', name:'Casual Leave',    isPaid:true,  maxDaysPerYear:6  },
  { id:'lt_004', name:'Maternity Leave', isPaid:true,  maxDaysPerYear:90 },
  { id:'lt_005', name:'Unpaid Leave',    isPaid:false, maxDaysPerYear:30 },
];

export const leaveAllocations = [
  { id:'la_001', employeeId:'emp_001', employee:'Priya Mehta',  leaveType:'Annual Leave', year:2026, allocated:15, used:4  },
  { id:'la_002', employeeId:'emp_001', employee:'Priya Mehta',  leaveType:'Sick Leave',   year:2026, allocated:10, used:2  },
  { id:'la_003', employeeId:'emp_004', employee:'Karan Singh',  leaveType:'Annual Leave', year:2026, allocated:15, used:7  },
  { id:'la_004', employeeId:'emp_006', employee:'Vikram Nair',  leaveType:'Sick Leave',   year:2026, allocated:10, used:0  },
  { id:'la_005', employeeId:'emp_007', employee:'Meera Joshi',  leaveType:'Annual Leave', year:2026, allocated:15, used:11 },
  { id:'la_006', employeeId:'emp_008', employee:'Amit Rawat',   leaveType:'Casual Leave', year:2026, allocated:6,  used:1  },
];

export const leaveRequests = [
  { id:'lr_001', employeeId:'emp_001', employee:'Priya Mehta',  type:'Sick Leave',   from:'2026-05-10', to:'2026-05-11', days:2, status:'approved', reason:'Fever and cold',      approvedBy:'Rahul Verma'  },
  { id:'lr_002', employeeId:'emp_004', employee:'Karan Singh',  type:'Annual Leave', from:'2026-05-20', to:'2026-05-25', days:5, status:'pending',  reason:'Family vacation',     approvedBy:null           },
  { id:'lr_003', employeeId:'emp_006', employee:'Vikram Nair',  type:'Casual Leave', from:'2026-05-08', to:'2026-05-08', days:1, status:'approved', reason:'Personal work',       approvedBy:'Rahul Verma'  },
  { id:'lr_004', employeeId:'emp_008', employee:'Amit Rawat',   type:'Sick Leave',   from:'2026-04-30', to:'2026-05-01', days:2, status:'rejected', reason:'Medical appointment', approvedBy:'Sneha Patel'  },
  { id:'lr_005', employeeId:'emp_007', employee:'Meera Joshi',  type:'Annual Leave', from:'2026-06-01', to:'2026-06-05', days:4, status:'pending',  reason:'Vacation',            approvedBy:null           },
];

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendanceLogs = [
  { id:'at_001', date:'2026-05-02', checkIn:'09:02 AM', checkOut:'06:15 PM', status:'present', hours:'9h 13m' },
  { id:'at_002', date:'2026-05-01', checkIn:'09:45 AM', checkOut:'06:00 PM', status:'late',    hours:'8h 15m' },
  { id:'at_003', date:'2026-04-30', checkIn:'08:55 AM', checkOut:'06:10 PM', status:'present', hours:'9h 15m' },
  { id:'at_004', date:'2026-04-29', checkIn:'',         checkOut:'',         status:'absent',  hours:'—'      },
  { id:'at_005', date:'2026-04-28', checkIn:'08:58 AM', checkOut:'06:05 PM', status:'present', hours:'9h 07m' },
  { id:'at_006', date:'2026-04-25', checkIn:'09:01 AM', checkOut:'05:55 PM', status:'present', hours:'8h 54m' },
  { id:'at_007', date:'2026-04-24', checkIn:'10:10 AM', checkOut:'06:00 PM', status:'late',    hours:'7h 50m' },
  { id:'at_008', date:'2026-04-23', checkIn:'08:50 AM', checkOut:'06:20 PM', status:'present', hours:'9h 30m' },
];

// Full company attendance (for Admin/HR/Payroll view)
export const allAttendance = employees.map(emp => ({
  employeeId: emp.id,
  employee:   emp.name,
  department: emp.department,
  date:       '2026-05-02',
  checkIn:    emp.status === 'inactive' ? '' : ['09:02 AM','08:55 AM','09:30 AM','09:05 AM','08:50 AM','09:15 AM'][Math.floor(Math.random()*6)] || '09:00 AM',
  checkOut:   null,
  status:     emp.status === 'inactive' ? 'absent' : ['present','present','present','late','present'][Math.floor(Math.random()*5)] || 'present',
  hours:      emp.status === 'inactive' ? '—' : '8h 30m',
}));

// ─── Payroll ──────────────────────────────────────────────────────────────────
export const payrolls = [
  { id:'pr_001', month:'April',    year:2026, status:'processed', employees:8, total:'₹8,42,500', generated:'2026-04-30' },
  { id:'pr_002', month:'March',    year:2026, status:'processed', employees:8, total:'₹8,42,500', generated:'2026-03-31' },
  { id:'pr_003', month:'February', year:2026, status:'processed', employees:7, total:'₹7,65,000', generated:'2026-02-28' },
  { id:'pr_004', month:'May',      year:2026, status:'draft',     employees:8, total:'—',          generated:'—'          },
];

export const payslipData = {
  employee:   { name:'Priya Mehta', code:'EMP001', designation:'Software Engineer', department:'Engineering', month:'April 2026', daysWorked:22, totalDays:26 },
  earnings:   [{ label:'Basic Salary', amount:75000 }, { label:'HRA', amount:30000 }, { label:'Other Allowances', amount:10000 }],
  deductions: [{ label:'Provident Fund (12%)', amount:9000 }, { label:'Professional Tax', amount:200 }, { label:'Income Tax (TDS)', amount:5000 }],
};

export const salaryStructures = [
  { id:'ss_001', employeeId:'emp_001', employee:'Priya Mehta',  basic:75000, hra:30000, allowances:10000, pf:12, profTax:200, effective:'2024-01-01' },
  { id:'ss_002', employeeId:'emp_004', employee:'Karan Singh',  basic:65000, hra:26000, allowances:8000,  pf:12, profTax:200, effective:'2024-03-01' },
  { id:'ss_003', employeeId:'emp_006', employee:'Vikram Nair',  basic:80000, hra:32000, allowances:12000, pf:12, profTax:200, effective:'2023-09-01' },
  { id:'ss_004', employeeId:'emp_007', employee:'Meera Joshi',  basic:90000, hra:36000, allowances:15000, pf:12, profTax:200, effective:'2023-01-01' },
  { id:'ss_005', employeeId:'emp_008', employee:'Amit Rawat',   basic:70000, hra:28000, allowances:9000,  pf:12, profTax:200, effective:'2024-04-01' },
];

// ─── Payroll Rules (Admin editable) ─────────────────────────────────────────
export const payrollRules = {
  pfPercentage:        12,
  employerPf:          12,
  professionalTax:     200,
  taxSlab1Rate:        5,   // up to 5L
  taxSlab2Rate:        20,  // 5L–10L
  taxSlab3Rate:        30,  // above 10L
  overtimeMultiplier:  1.5,
  payrollCycle:        'Monthly',
  cutoffDate:          25,
  gratuityRate:        4.81,
  esiThreshold:        21000,
  esiRate:             0.75,
};

// ─── System Alerts (Admin only) ───────────────────────────────────────────────
export const systemAlerts = [
  { id:'alrt_001', type:'no_bank_details', severity:'warning', employeeId:'emp_001', employee:'Priya Mehta',  department:'Engineering', message:'No bank details on file — payroll will be held.' },
  { id:'alrt_002', type:'no_bank_details', severity:'warning', employeeId:'emp_005', employee:'Anjali Gupta', department:'Analytics',   message:'No bank details on file — payroll will be held.' },
  { id:'alrt_003', type:'no_manager',      severity:'info',    employeeId:'emp_002', employee:'Rahul Verma',  department:'HR',          message:'No manager assigned to this employee.'            },
  { id:'alrt_004', type:'no_manager',      severity:'info',    employeeId:'emp_005', employee:'Anjali Gupta', department:'Analytics',   message:'No manager assigned to this employee.'            },
  { id:'alrt_005', type:'no_manager',      severity:'info',    employeeId:'emp_008', employee:'Amit Rawat',   department:'Engineering', message:'No manager assigned to this employee.'            },
];

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsData = {
  leaveByDept: [
    { dept:'Engineering', approved:8,  pending:2, rejected:1 },
    { dept:'HR',          approved:2,  pending:0, rejected:0 },
    { dept:'Finance',     approved:3,  pending:1, rejected:0 },
    { dept:'Design',      approved:7,  pending:0, rejected:2 },
    { dept:'Product',     approved:11, pending:1, rejected:0 },
    { dept:'Analytics',   approved:0,  pending:0, rejected:0 },
  ],
  hoursWorked: [
    { employee:'Priya Mehta',  hours:162, target:192 },
    { employee:'Rahul Verma',  hours:180, target:192 },
    { employee:'Sneha Patel',  hours:172, target:192 },
    { employee:'Karan Singh',  hours:155, target:192 },
    { employee:'Vikram Nair',  hours:188, target:192 },
    { employee:'Meera Joshi',  hours:148, target:192 },
    { employee:'Amit Rawat',   hours:140, target:192 },
  ],
  monthlyAttendance: [
    { month:'Jan', present:19, absent:3, late:2 },
    { month:'Feb', present:20, absent:1, late:3 },
    { month:'Mar', present:22, absent:0, late:1 },
    { month:'Apr', present:18, absent:2, late:3 },
    { month:'May', present:8,  absent:1, late:1 },
  ],
};

// ─── Resume data ──────────────────────────────────────────────────────────────
export const resumeData = {
  skills:    ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'REST APIs', 'Git'],
  experience:[
    { company:'Acme Corp',    title:'Software Engineer',     from:'Mar 2023', to:'Present', desc:'Building scalable HR management systems.' },
    { company:'TechStart Pvt',title:'Junior Developer',      from:'Jun 2021', to:'Feb 2023', desc:'Developed e-commerce frontend with React.' },
  ],
  education: [
    { institution:'IIT Mumbai', degree:'B.Tech Computer Science', year:'2021' },
  ],
  certifications:[
    { name:'AWS Certified Developer', issuer:'Amazon Web Services', year:'2023' },
    { name:'React Advanced Patterns', issuer:'Frontend Masters',    year:'2022' },
  ],
  about:'Passionate software engineer with 3+ years of experience building modern web applications. Strong advocate for clean code and great developer experience.',
};

// ─── Audit Logs ──────────────────────────────────────────────────────────────
export const auditLogs = [
  { id:'al_001', action:'Employee Added',    actor:'Rahul Verma',  target:'Amit Rawat',  time:'2026-05-01 10:15', table:'employee_profiles' },
  { id:'al_002', action:'Leave Approved',    actor:'Sneha Patel',  target:'Priya Mehta', time:'2026-05-01 11:30', table:'leave_requests'    },
  { id:'al_003', action:'Payroll Generated', actor:'Sneha Patel',  target:'April 2026',  time:'2026-04-30 18:00', table:'payrolls'          },
  { id:'al_004', action:'Role Changed',      actor:'Arjun Sharma', target:'Meera Joshi', time:'2026-04-29 14:20', table:'users'             },
  { id:'al_005', action:'Salary Updated',    actor:'Sneha Patel',  target:'Vikram Nair', time:'2026-04-28 09:45', table:'salary_structures' },
];
