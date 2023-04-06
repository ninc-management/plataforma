import { Course, CourseParticipant } from '@models/course';

export const externalMockedCourseParticipants: CourseParticipant[] = [
  {
    _id: '0',
    address: 'Test Address',
    CPF: '000.000.000.00',
    date: new Date(),
    email: 'mockedCourse@participant1.com',
    isSpeaker: true,
    job: 'Test Job',
    name: 'MockedCourseParticipant1',
    phone: '+55 82 00000-0000',
  },
  {
    _id: '1',
    address: 'Test Address',
    CPF: '000.000.000.01',
    date: new Date(),
    email: 'mockedCourse@participant2.com',
    isSpeaker: true,
    job: 'Test Job',
    name: 'MockedCourseParticipant2',
    phone: '+55 82 00000-0001',
  },
];

export const externalMockedCourses: Course[] = [
  {
    _id: '0',
    courseHours: '10',
    hasCertificate: true,
    name: 'Test Course 1',
    participants: externalMockedCourseParticipants,
    place: 'Test Place 1',
    price: '100',
    resources: [],
    speaker: externalMockedCourseParticipants[0],
    startDate: new Date(),
  },
  {
    _id: '1',
    courseHours: '15',
    hasCertificate: true,
    name: 'Test Course 2',
    participants: externalMockedCourseParticipants,
    place: 'Test Place 2',
    price: '200',
    resources: [],
    speaker: externalMockedCourseParticipants[0],
    startDate: new Date(),
  },
];
