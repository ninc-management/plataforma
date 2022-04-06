import * as express from 'express';
import ContractModel from '../models/contract';
import MessageModel from '../models/message';
import { Contract } from '../models/contract';
import { Message } from '../models/message';
import { Mutex } from 'async-mutex';
import { cloneDeep } from 'lodash';
import { contractsMap, messagesMap } from '../shared/global';

const router = express.Router();
let requested = false;
let requestedMessage = false;
const mutex = new Mutex();

router.post('/', (req, res, next) => {
  const contract = new ContractModel(req.body.contract);
  mutex.acquire().then((release) => {
    contract
      .save()
      .then((savedContract) => {
        if (requested) contractsMap[savedContract._id] = cloneDeep(savedContract.toJSON());
        release();
        return res.status(201).json({
          message: 'Contrato cadastrado!',
        });
      })
      .catch((err) => {
        release();
        return res.status(500).json({
          message: 'Erro ao cadastrar contrato!',
          error: err,
        });
      });
  });
});

router.post('/update', async (req, res, next) => {
  await ContractModel.findByIdAndUpdate(
    req.body.contract._id,
    req.body.contract,
    { upsert: false },
    async (err, savedContract) => {
      if (err)
        return res.status(500).json({
          message: 'Erro ao atualizar contrato!',
          error: err,
        });
      if (requested) {
        await mutex.runExclusive(async () => {
          contractsMap[req.body.contract._id] = cloneDeep(savedContract.toJSON());
        });
      }
      return res.status(200).json({
        message: 'Contrato Atualizado!',
      });
    }
  );
});

router.post('/count', (req, res) => {
  res.json({
    size: Array.from(Object.values(contractsMap)).length,
  });
});

router.post('/all', async (req, res) => {
  if (!requested) {
    const contracts: Contract[] = await ContractModel.find({});
    contracts.map((contract) => (contractsMap[contract._id] = cloneDeep(contract)));
    requested = true;
  }
  return res.status(200).json(Array.from(Object.values(contractsMap)));
});

router.post('/createMessage', (req, res, next) => {
  const message = new MessageModel(req.body.message);
  mutex.acquire().then((release) => {
    message
      .save()
      .then((savedMessage) => {
        if (requested) messagesMap[savedMessage._id] = cloneDeep(savedMessage.toJSON());
        release();
        return res.status(201).json({
          message: 'Comentário cadastrado!',
        });
      })
      .catch((err) => {
        release();
        return res.status(500).json({
          message: 'Erro ao cadastrar comentário!',
          error: err,
        });
      });
  });
});

router.post('/allMessages', async (req, res) => {
  if (!requestedMessage) {
    const messages: Message[] = await MessageModel.find({});
    messages.map((message) => (messagesMap[message._id] = cloneDeep(message)));
    requestedMessage = true;
  }
  return res.status(200).json(Array.from(Object.values(messagesMap)));
});

export default router;
