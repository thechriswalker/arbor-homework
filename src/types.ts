export type Homework = {
  id: string;
  //url: string;
  isDone: boolean;
  subject: string;
  status: string;
  dueDate: Date;
  detail: HomeworkDetail | null;
};
export type HomeworkDetail = {
  instructions: string;
};

export type StudentInfo = {
  name: string;
  img: string;
  form: string;
};

export type Week = {
  id: string;
  name: string;
  days: Array<Array<Period>>;
};
export type Period = {
  subject: string;
  group: string;
  timing: string;
};

export type HomeworkAPIResponse = Array<{
  id: number;
  student: StudentInfo;
  homework: Array<Homework>;
}>;

export type TimetableAPIResponse = Array<{
  id: number;
  student: StudentInfo;
  timetable: Array<Week>;
}>;
