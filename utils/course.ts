import type { JwchCourseListResponse_Course, JwchCourseListResponse_CourseScheduleRule } from '@/api/backend';
import type { CourseSetting } from '@/api/interface';
import { COURSE_SETTINGS_KEY } from '@/lib/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ParsedCourse = Omit<JwchCourseListResponse_Course, 'rawAdjust' | 'rawScheduleRules' | 'scheduleRules'> &
  JwchCourseListResponse_CourseScheduleRule;

export const SCHEDULE_ITEM_MIN_HEIGHT = 49;
export const SCHEDULE_MIN_HEIGHT = SCHEDULE_ITEM_MIN_HEIGHT * 11;

// 解析课程数据，将课程数据中的 scheduleRules 展开，返回一个新的数组
export function parseCourses(courses: JwchCourseListResponse_Course[]): ParsedCourse[] {
  const parsedCourses = courses.flatMap(course =>
    course.scheduleRules.map(rule => {
      const { rawAdjust, rawScheduleRules, scheduleRules, ...rest } = course;

      return {
        ...rest,
        ...rule,
      };
    }),
  );

  return parsedCourses;
}

export function getFirstDateByWeek(semesterStart: string, currentWeek: number): string {
  const startDate = new Date(semesterStart);
  const startDayOfWeek = (startDate.getDay() + 6) % 7; // 将星期日（0）转换为 6，其他天数减 1 对应星期一到星期六
  const adjustedStartDate = new Date(startDate);

  // 如果学期开始日期不是星期一，则调整到最近的星期一
  adjustedStartDate.setDate(startDate.getDate() - startDayOfWeek);

  const firstDayOfWeek = new Date(adjustedStartDate);
  firstDayOfWeek.setDate(firstDayOfWeek.getDate() + (currentWeek - 1) * 7);

  return firstDayOfWeek.toISOString().split('T')[0]; // 返回日期字符串格式 YYYY-MM-DD
}

// 根据学期开始日期和当前周数获取当前周的日期（会返回一个完整的一周）
export function getDatesByWeek(semesterStart: string, currentWeek: number): string[] {
  const firstDayOfWeek = new Date(getFirstDateByWeek(semesterStart, currentWeek));
  firstDayOfWeek.setDate(firstDayOfWeek.getDate() + (currentWeek - 1) * 7);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(firstDayOfWeek);
    date.setDate(firstDayOfWeek.getDate() + i);
    return date.toISOString().split('T')[0]; // 返回日期字符串格式 YYYY-MM-DD
  });
}

// 根据学期开始日期和结束日期计算一学期一共有多少周
export function getWeeksBySemester(semesterStart: string, semesterEnd: string): number {
  const startDate = new Date(semesterStart);
  const endDate = new Date(semesterEnd);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.ceil(diffDays / 7);
}

export const defaultCourseSetting: CourseSetting = {
  selectedSemester: '',
  calendarExportEnabled: false,
  showNonCurrentWeekCourses: false,
};

// 本质是将传入的 courseSetting 与 defaultCourseSetting 合并
export const normalizeCourseSetting = (courseSetting: Partial<CourseSetting> = {}): CourseSetting => {
  // 如果传入的 courseSetting 为空，则返回默认设置
  if (!courseSetting) {
    return defaultCourseSetting;
  }

  // 合并默认设置和传入的设置
  return { ...defaultCourseSetting, ...courseSetting } as CourseSetting;
};

export const readCourseSetting = async (): Promise<CourseSetting> => {
  const setting = await AsyncStorage.getItem(COURSE_SETTINGS_KEY);

  if (!setting) {
    await AsyncStorage.setItem(COURSE_SETTINGS_KEY, JSON.stringify(defaultCourseSetting));
    return defaultCourseSetting;
  }

  const config = normalizeCourseSetting(JSON.parse(setting));
  await AsyncStorage.setItem(COURSE_SETTINGS_KEY, JSON.stringify(config));

  return config;
};
