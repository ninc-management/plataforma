import { TestBed } from '@angular/core/testing';
import { PromotionService } from './promotion.service';
import { CommonTestingModule } from 'app/../common-testing.module';
import { Promotion } from '@models/promotion';
import { HttpTestingController } from '@angular/common/http/testing';
import { Subject } from 'rxjs';
import { SocketMock } from 'types/socketio-mock';
import { AuthService } from 'app/auth/auth.service';
import MockedServerSocket from 'socket.io-mock';
import { Socket } from 'ngx-socket-io';
import { take } from 'rxjs/operators';
import { cloneDeep } from 'lodash';
import {
  PROMOTION_STATOOS,
  RULE_OBJECTS,
  RULE_OPERATORS,
} from 'app/pages/promotions/promotion-item/promotion-item.component';
import { reviveDates } from 'app/shared/utils';

describe('PromotionService', () => {
  let service: PromotionService;
  let httpMock: HttpTestingController;
  let mockedPromotions: Promotion[];
  const socket$ = new Subject<any>();
  const socket: SocketMock = new MockedServerSocket();
  const authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['userEmail'], {
    onUserChange$: new Subject<void>(),
  });
  const socketServiceSpy = jasmine.createSpyObj<Socket>('Socket', ['fromEvent']);
  CommonTestingModule.setUpTestBed();

  const baseTest = (name: string, test: (expectedPromotions: Promotion[]) => void) => {
    it(name, (done: DoneFn) => {
      let i = 1;
      service
        .getPromotions()
        .pipe(take(2))
        .subscribe((promotions) => {
          switch (i) {
            case 1: {
              i += 1;
              expect(promotions.length).toBe(0);
              break;
            }
            case 2: {
              const expectedPromotions = reviveDates(mockedPromotions);
              expect(promotions.length).toBe(1);
              expect(promotions).toEqual(expectedPromotions);
              test(expectedPromotions);
              done();
              break;
            }
            default: {
              break;
            }
          }
        });

      const req = httpMock.expectOne('/api/promotion/all');
      expect(req.request.method).toBe('POST');
      setTimeout(() => {
        req.flush(mockedPromotions);
      }, 50);
    });
  };

  beforeEach(() => {
    TestBed.overrideProvider(AuthService, { useValue: authServiceSpy });
    TestBed.overrideProvider(Socket, { useValue: socketServiceSpy });
    authServiceSpy.userEmail.and.returnValue('test1@te.st');
    socketServiceSpy.fromEvent.and.returnValue(socket$);
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(PromotionService);

    mockedPromotions = [];

    const tmpPromotion = new Promotion();
    tmpPromotion._id = '0';
    tmpPromotion.name = 'Test';
    tmpPromotion.cashback = '15';
    tmpPromotion.status = PROMOTION_STATOOS.EM_ANDAMENTO;
    tmpPromotion.start = new Date();
    tmpPromotion.end = new Date();
    tmpPromotion.rules = [
      {
        container: RULE_OBJECTS.CONTRATOS,
        operator: RULE_OPERATORS.MAIOR_IGUAL,
        value: '1000',
      },
    ];

    mockedPromotions.push(cloneDeep(tmpPromotion));
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('savePromotion should work', (done: DoneFn) => {
    const tmpPromotion = new Promotion();
    tmpPromotion._id = '1';
    tmpPromotion.name = 'Test2';
    tmpPromotion.cashback = '10';
    tmpPromotion.status = PROMOTION_STATOOS.EM_ANDAMENTO;
    tmpPromotion.start = new Date();
    tmpPromotion.end = new Date();
    tmpPromotion.rules = [
      {
        container: RULE_OBJECTS.CONTRATOS,
        operator: RULE_OPERATORS.MAIOR_IGUAL,
        value: '1500',
      },
    ];

    const data = {
      ns: {
        coll: 'promotions',
      },
      operationType: 'insert',
      fullDocument: tmpPromotion,
    };
    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));

    let i = 1;
    service
      .getPromotions()
      .pipe(take(3))
      .subscribe((promotions: Promotion[]) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(promotions.length).toBe(0);
            break;
          }
          case 2: {
            i += 1;
            expect(promotions.length).toBe(1);
            expect(promotions).toEqual(reviveDates(mockedPromotions));
            service.savePromotion(tmpPromotion);

            const req1 = httpMock.expectOne('/api/promotion/');
            expect(req1.request.method).toBe('POST');
            req1.flush(null);
            socket.emit('dbchange', data);
            break;
          }

          case 3: {
            expect(promotions.length).toBe(2);
            mockedPromotions.push(tmpPromotion);
            expect(reviveDates(promotions)).toEqual(reviveDates(mockedPromotions));
            done();
            break;
          }

          default: {
            break;
          }
        }
      });

    const req = httpMock.expectOne('/api/promotion/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedPromotions);
    }, 50);
  });

  it('editPromotions should work', (done: DoneFn) => {
    const tmpPromotion = cloneDeep(mockedPromotions[0]);
    tmpPromotion.status = PROMOTION_STATOOS.CONCLUIDO;

    let i = 1;
    const data = {
      ns: {
        coll: 'promotions',
      },
      operationType: 'update',
      documentKey: {
        _id: '0',
      },
      updateDescription: {
        updatedFields: { status: PROMOTION_STATOOS.CONCLUIDO },
        removedFields: [] as any[],
      },
    };
    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));

    service
      .getPromotions()
      .pipe(take(3))
      .subscribe((promotions) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(promotions.length).toBe(0);
            break;
          }
          case 2: {
            i += 1;
            expect(promotions.length).toBe(1);
            expect(promotions).toEqual(reviveDates(mockedPromotions));

            service.editPromotion(tmpPromotion);
            const req1 = httpMock.expectOne('/api/promotion/update');
            expect(req1.request.method).toBe('POST');
            req1.flush(null);
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(promotions.length).toBe(1);
            expect(promotions[0].status).toBe(PROMOTION_STATOOS.CONCLUIDO);
            done();
            break;
          }
          default: {
            break;
          }
        }
      });
    // mock response
    const req = httpMock.expectOne('/api/promotion/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedPromotions);
    }, 50);
  });

  it('getPromotions should work', () => {});

  baseTest('idToPromotion should work', (expectedPromotions: Promotion[]) => {
    expect(service.idToPromotion('0')).toEqual(expectedPromotions[0]);
    expect(service.idToPromotion(expectedPromotions[0])).toEqual(expectedPromotions[0]);
  });
});
