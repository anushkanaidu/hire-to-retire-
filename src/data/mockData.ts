import { Employee, Country, BGVStatus } from '../types';
import Papa from 'papaparse';

export const parseEmployeeData = (csvString: string): Employee[] => {
  const results = Papa.parse(csvString.trim(), {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    delimiter: ",",
  });

  console.log('Parsed Rows Count:', results.data.length);
  if (results.errors.length > 0) {
    console.error('PapaParse Errors:', results.errors);
  }

  return results.data.map((row: any) => ({
    employee_id: String(row.employee_id || ''),
    firstname: String(row.firstname || ''),
    lastname: String(row.lastname || ''),
    startdate: String(row.startdate || ''),
    exitdate: String(row.exitdate || ''),
    title: String(row.title || ''),
    businessunit: String(row.businessunit || ''),
    employeestatus: String(row.employeestatus || ''),
    departmenttype: String(row.departmenttype || '').trim(),
    division: String(row.division || ''),
    state: String(row.state || ''),
    performance_score: String(row.performance_score || ''),
    current_employee_rating: Number(row.current_employee_rating || 0),
    application_date: String(row.application_date || ''),
    education_level: String(row.education_level || ''),
    years_of_experience: Number(row.years_of_experience || 0),
    desired_salary: Number(row.desired_salary || 0),
    job_title: String(row.job_title || ''),
    recruitment_status: String(row.recruitment_status || ''),
    survey_date: String(row.survey_date || ''),
    engagement_score: Number(row.engagement_score || 0),
    satisfaction_score: Number(row.satisfaction_score || 0),
    'work-life_balance_score': Number(row['work-life_balance_score'] || 0),
    flight_risk: String(row.flight_risk || ''),
    country: (row.country === 'Singapore' ? 'Singapore' : row.country === 'India' ? 'India' : row.country) as Country,
    bgv_agency: String(row.bgv_agency || ''),
    bgv_status: String(row.bgv_status || '') as BGVStatus,
    bgv_days_elapsed: Number(row.bgv_days_elapsed || 0),
    bgv_sla_days: Number(row.bgv_sla_days || 0),
    bgv_at_risk: String(row.bgv_at_risk || 'No') as 'Yes' | 'No',
    onboarding_type: String(row.onboarding_type || ''),
    laptop_assigned: String(row.laptop_assigned || 'No') as 'Yes' | 'No',
    day0_completed: String(row.day0_completed || 'No') as 'Yes' | 'No',
    orientation_completed: String(row.orientation_completed || 'No') as 'Yes' | 'No',
    harassment_policy: String(row.harassment_policy || 'No') as 'Yes' | 'No',
    ai_ethics: String(row.ai_ethics || 'No') as 'Yes' | 'No',
    gemini_training: String(row.gemini_training || 'No') as 'Yes' | 'No',
    figma_training: String(row.figma_training || 'No') as 'Yes' | 'No',
    asana_onboarded: String(row.asana_onboarded || 'No') as 'Yes' | 'No',
    days_since_joining: Number(row.days_since_joining || 0),
    onboarding_complete: String(row.onboarding_complete || 'No') as 'Yes' | 'No',
    modules_completed: Number(row.modules_completed || 0),
    compliance_pct: Number(row.compliance_pct || 0),
    total_trainings: Number(row.total_trainings || 0),
    completed_trainings: Number(row.completed_trainings || 0),
    passed_trainings: Number(row.passed_trainings || 0),
    failed_trainings: Number(row.failed_trainings || 0),
  }));
};
