const LIKERT = [1, 2, 3, 4, 5];

function q(id, label, category = 'General') {
  return { id, label, category, weight: 1 };
}

function matrix(key, title, questions, extra = {}) {
  return { key, title, questions, likertScale: LIKERT, ...extra };
}

const EMPLOYEE_QUESTIONS = [
  q('eq1', 'I understand company goals', 'Alignment'),
  q('eq2', 'I have tools to do my job', 'Resources'),
  q('eq3', 'Communication is effective', 'Communication'),
  q('eq4', 'I feel valued', 'Culture'),
  q('eq5', 'Safety practices are followed', 'Operations'),
];

export const MATRIX_CONFIGS = {
  'employee-questionnaire-pg1': matrix('employee-questionnaire-pg1', 'Employee Questionnaire PG1', EMPLOYEE_QUESTIONS),
  'employee-questionnaire-pg2': matrix('employee-questionnaire-pg2', 'Employee Questionnaire PG2', [
    q('eq6', 'Training is adequate', 'Development'),
    q('eq7', 'Workload is manageable', 'Workload'),
    q('eq8', 'Leadership is accessible', 'Leadership'),
    q('eq9', 'Processes are efficient', 'Operations'),
    q('eq10', 'I would recommend this employer', 'Retention'),
  ]),
  'employee-questionnaire-tally': matrix('employee-questionnaire-tally', 'Employee Questionnaire Tally', [], {
    derivedFrom: ['employee-questionnaire-pg1', 'employee-questionnaire-pg2'],
  }),
  'emp-questionnaire-graph': matrix('emp-questionnaire-graph', 'Emp Questionnaire Graph', [], {
    derivedFrom: ['employee-questionnaire-tally'],
  }),
  'employee-eval-matrix': matrix('employee-eval-matrix', 'Employee Eval Matrix', [
    q('ev1', 'Quality of work', 'Performance'),
    q('ev2', 'Productivity', 'Performance'),
    q('ev3', 'Teamwork', 'Behavior'),
    q('ev4', 'Initiative', 'Behavior'),
    q('ev5', 'Attendance & reliability', 'Behavior'),
  ]),
  'management-matrix': matrix('management-matrix', 'Management Matrix', [
    q('mg1', 'Sets clear expectations', 'Leadership'),
    q('mg2', 'Coaches employees', 'Leadership'),
    q('mg3', 'Holds accountability', 'Leadership'),
    q('mg4', 'Plans effectively', 'Planning'),
    q('mg5', 'Delegates appropriately', 'Planning'),
  ]),
  'management-styles': matrix('management-styles', 'MANAGEMENT STYLES', [
    q('ms1', 'Directive vs participative balance', 'Style'),
    q('ms2', 'Conflict resolution approach', 'Style'),
    q('ms3', 'Decision speed', 'Style'),
    q('ms4', 'Risk tolerance', 'Style'),
  ]),
  'operational-matrix': matrix('operational-matrix', 'Operational Matrix', [
    q('op1', 'Process documentation', 'Operations'),
    q('op2', 'Quality control', 'Quality'),
    q('op3', 'Capacity utilization', 'Operations'),
    q('op4', 'Supply chain reliability', 'Operations'),
  ]),
  'organizational-matrix': matrix('organizational-matrix', 'Organizational Matrix', [
    q('or1', 'Role clarity', 'Structure'),
    q('or2', 'Span of control', 'Structure'),
    q('or3', 'Cross-functional coordination', 'Structure'),
    q('or4', 'Succession planning', 'Structure'),
  ]),
  'contractor-matrix': matrix('contractor-matrix', 'Contractor Matrix', [
    q('ct1', 'Contractor quality', 'Contractors'),
    q('ct2', 'Cost control', 'Contractors'),
    q('ct3', 'Schedule adherence', 'Contractors'),
    q('ct4', 'Safety compliance', 'Contractors'),
  ]),
  'financial-matrix': matrix('financial-matrix', 'Financial Matrix', [
    q('fn1', 'Cash management', 'Finance'),
    q('fn2', 'Margin discipline', 'Finance'),
    q('fn3', 'Reporting timeliness', 'Finance'),
    q('fn4', 'Budget variance control', 'Finance'),
  ]),
  'manufact-matrix': matrix('manufact-matrix', 'Manufact Matrix', [
    q('mf1', 'Throughput', 'Manufacturing'),
    q('mf2', 'Scrap / rework', 'Manufacturing'),
    q('mf3', 'Equipment uptime', 'Manufacturing'),
    q('mf4', 'Labor efficiency', 'Manufacturing'),
  ]),
  'sales-marketing-matrix': matrix('sales-marketing-matrix', 'Sales & Marketing Matrix', [
    q('sm1', 'Lead generation', 'Sales'),
    q('sm2', 'Conversion rate', 'Sales'),
    q('sm3', 'Brand positioning', 'Marketing'),
    q('sm4', 'Campaign ROI', 'Marketing'),
  ]),
  'sales-marketing-dist-matrix': matrix('sales-marketing-dist-matrix', 'Sales & Marketing- Dist. Matrix', [
    q('sd1', 'Channel coverage', 'Distribution'),
    q('sd2', 'Partner performance', 'Distribution'),
    q('sd3', 'Territory balance', 'Distribution'),
    q('sd4', 'Pricing consistency', 'Distribution'),
  ]),
};
