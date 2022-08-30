import { Mutex } from 'async-mutex';
import * as express from 'express';
import { cloneDeep } from 'lodash';

import CourseModel, { Course } from '../models/course';
import { coursesMap } from '../shared/global';

const router = express.Router();
let requested = false;
const mutex = new Mutex();

router.post('/', (req, res, next) => {
  const course = new CourseModel(req.body.course);
  mutex.acquire().then((release) => {
    course
      .save()
      .then((savedCourse) => {
        if (requested) coursesMap[savedCourse._id] = cloneDeep(savedCourse.toJSON());
        release();
        return res.status(201).json({
          message: 'Curso cadastrado!',
        });
      })
      .catch((err) => {
        release();
        return res.status(500).json({
          message: 'Erro ao cadastrar curso!',
          error: err,
        });
      });
  });
});

router.post('/update', async (req, res, next) => {
  try {
    const savedCourse = await CourseModel.findByIdAndUpdate(req.body.course._id, req.body.course, { upsert: false });
    if (requested) {
      await mutex.runExclusive(async () => {
        coursesMap[req.body.course._id] = cloneDeep(savedCourse.toJSON());
      });
    }
    return res.status(200).json({
      message: 'Curso Atualizado!',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao atualizar curso!',
      error: err,
    });
  }
});

router.post('/count', (req, res) => {
  res.json({
    size: Array.from(Object.values(coursesMap)).length,
  });
});

router.post('/all', async (req, res) => {
  if (!requested) {
    const courses: Course[] = await CourseModel.find({});
    courses.map((course) => (coursesMap[course._id] = cloneDeep(course)));
    requested = true;
  }
  return res.status(200).json(Array.from(Object.values(coursesMap)));
});

export default router;
