import * as express from 'express';

import CourseModel, { Course } from '../models/course';
import { getModelForCompany } from '../shared/util';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const companyId = req.headers.companyid as string;
    const courseCompanyModel = await getModelForCompany(companyId, CourseModel);
    const course = new courseCompanyModel(req.body.course);
    await course.save();
    return res.status(201).json({
      message: 'Curso cadastrado!',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao cadastrar curso!',
      error: err,
    });
  }
});

router.post('/update', async (req, res, next) => {
  try {
    const companyId = req.headers.companyid as string;
    const courseCompanyModel = await getModelForCompany(companyId, CourseModel);
    const course = await courseCompanyModel.findOneAndUpdate(
      { _id: req.body.course._id, __v: req.body.course.__v },
      req.body.course,
      {
        upsert: false,
      }
    );
    if (!course) {
      return res.status(500).json({
        message: 'O documento foi atualizado por outro usuário. Por favor, recarregue os dados e tente novamente.',
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

router.post('/all', async (req, res) => {
  try {
    const companyId = req.headers.companyid as string;
    const courseCompanyModel = await getModelForCompany(companyId, CourseModel);
    const courses: Course[] = await courseCompanyModel.find({});
    return res.status(200).json(courses);
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao buscar cursos!',
      error: err,
    });
  }
});

export default router;
