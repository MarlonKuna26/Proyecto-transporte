
/// <reference types="jest" />

import { RegisterDTO } from '../../src/modules/auth/application/dtos/RegisterDTO';
import { RegisterUseCase } from '../../src/modules/auth/application/usecases/RegisterUseCase';
import { ConflictError } from '../../src/shared/errors/AppError';

jest.mock('../../src/config/database', () => ({
  DatabaseConnection: {
    getInstance: jest.fn().mockReturnValue({
      query: jest.fn().mockResolvedValue({})
    })
  }
}));

jest.mock('../../src/shared/services', () => ({
  PasswordService: {
    hash: jest.fn().mockResolvedValue('hashedPassword123')
  }
}));

jest.mock('../../src/shared/services/EmailService', () => ({
  EmailService: {
    sendVerificationEmail: jest.fn().mockResolvedValue(true)
  }
}));

describe('RF-001 RegisterUseCase (sin BD)', () => {
  let mockRepo: any;
  let useCase: RegisterUseCase;

  beforeEach(() => {
    mockRepo = {
      findByEmail: jest.fn()
    };

    useCase = new RegisterUseCase(mockRepo);

    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('acepta correo institucional válido', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);

    const dto = new RegisterDTO('test@uta.edu.ec', 'Viviana', 'Password1');

    const result = await useCase.execute(dto);

    expect(result.pendingVerification).toBe(true);
  });

  it('rechaza correo no institucional', () => {
    expect(() => {
      new RegisterDTO('test@gmail.com', 'Viviana', 'Password1');
    }).toThrow();
  });

  it('rechaza correo mal formado', () => {
    expect(() => {
      new RegisterDTO('test@uta', 'Viviana', 'Password1');
    }).toThrow();
  });

  it('acepta nombre válido', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);

    const dto = new RegisterDTO('test@uta.edu.ec', 'Ana', 'Password1');

    const result = await useCase.execute(dto);

    expect(result.pendingVerification).toBe(true);
  });

  it('rechaza nombre vacío', () => {
    expect(() => {
      new RegisterDTO('test@uta.edu.ec', '', 'Password1');
    }).toThrow();
  });

  it('rechaza nombre muy corto', () => {
    expect(() => {
      new RegisterDTO('test@uta.edu.ec', 'A', 'Password1');
    }).toThrow();
  });

  it('acepta contraseña válida', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);

    const dto = new RegisterDTO('test@uta.edu.ec', 'Viviana', 'Password1');

    const result = await useCase.execute(dto);

    expect(result.pendingVerification).toBe(true);
  });

  it('rechaza contraseña débil', () => {
    expect(() => {
      new RegisterDTO('test@uta.edu.ec', 'Viviana', '123');
    }).toThrow();
  });

  it('rechaza si el usuario ya existe', async () => {
    mockRepo.findByEmail.mockResolvedValue({ id: 1 });

    const dto = new RegisterDTO('test@uta.edu.ec', 'Viviana', 'Password1');

    await expect(useCase.execute(dto)).rejects.toThrow(ConflictError);
  });

  it('hashea la contraseña', async () => {
    const { PasswordService } = require('../../src/shared/services');

    mockRepo.findByEmail.mockResolvedValue(null);

    const dto = new RegisterDTO('test@uta.edu.ec', 'Viviana', 'Password1');

    await useCase.execute(dto);

    expect(PasswordService.hash).toHaveBeenCalledWith('Password1');
  });

  it('envía correo de verificación', async () => {
    const { EmailService } = require('../../src/shared/services/EmailService');

    mockRepo.findByEmail.mockResolvedValue(null);

    const dto = new RegisterDTO('test@uta.edu.ec', 'Viviana', 'Password1');

    await useCase.execute(dto);

    expect(EmailService.sendVerificationEmail).toHaveBeenCalled();
  });

  it('falla si el envío de correo falla', async () => {
    const { EmailService } = require('../../src/shared/services/EmailService');

    EmailService.sendVerificationEmail.mockRejectedValueOnce(new Error('SMTP error'));

    mockRepo.findByEmail.mockResolvedValue(null);

    const dto = new RegisterDTO('test@uta.edu.ec', 'Viviana', 'Password1');

    await expect(useCase.execute(dto)).rejects.toThrow();
  });

  it('retorna estructura correcta', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);

    const dto = new RegisterDTO('test@uta.edu.ec', 'Viviana', 'Password1');

    const result = await useCase.execute(dto);

    expect(result).toMatchObject({
      pendingVerification: true,
      expiresInMinutes: 30
    });
  });
});

