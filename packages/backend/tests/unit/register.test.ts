import { RegisterUseCase } from '../../src/modules/auth/application/usecases/RegisterUseCase';
import { RegisterDTO } from '../../src/modules/auth/application/dtos/RegisterDTO';

describe('RegisterUseCase', () => {
	let userRepositoryMock: any;
	let useCase: RegisterUseCase;

	beforeEach(() => {
		userRepositoryMock = {
			findByEmail: jest.fn(),
			create: jest.fn(),
		};

		useCase = new RegisterUseCase(userRepositoryMock);

		// Mock para código de verificación fijo
		jest.spyOn(global.Math, 'random').mockReturnValue(0.123456);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('debe registrar correctamente un usuario nuevo', async () => {
		// Mock: no existe usuario
		userRepositoryMock.findByEmail.mockResolvedValue(null);

		const input = new RegisterDTO(
			'hvillavicencio8210@uta.edu.ec',
			'Heidi',
			'Heidi2003'
		);

		// Mock PasswordService
		jest
			.spyOn(
				require('../../src/shared/services/PasswordService').PasswordService,
				'hash'
			)
			.mockResolvedValue('hash123');

		// Mock EmailService
		jest
			.spyOn(
				require('../../src/shared/services/EmailService').EmailService,
				'sendVerificationEmail'
			)
				.mockImplementation(async () => {});

		// Mock Database
		jest
			.spyOn(
				require('../../src/config/database').DatabaseConnection,
				'getInstance'
			)
			.mockReturnValue({
				query: jest.fn().mockResolvedValue({}),
			});

		const result = await useCase.execute(input);

		expect(result.email).toBe('hvillavicencio8210@uta.edu.ec');
		expect(result.name).toBe('Heidi');
		expect(result.pendingVerification).toBe(true);
	});

	it('debe fallar si el correo ya existe', async () => {
		userRepositoryMock.findByEmail.mockResolvedValue({
			email: 'hvillavicencio8210@uta.edu.ec',
		});

		const input = new RegisterDTO(
			'hvillavicencio8210@uta.edu.ec',
			'Heidi',
			'Heidi2003'
		);

		await expect(useCase.execute(input)).rejects.toThrow(
			'A user with this email already exists'
		);
	});

	it('debe fallar si el correo no es institucional', () => {
		expect(() => {
			new RegisterDTO(
				'otro@gmail.com',
				'Heidi',
				'Heidi2003'
			);
		}).toThrow('Solo se permiten correos institucionales @uta.edu.ec');
	});

	it('debe fallar si la contraseña es débil', () => {
		expect(() => {
			new RegisterDTO(
				'hvillavicencio8210@uta.edu.ec',
				'Heidi',
				'123'
			);
		}).toThrow(
			'La contraseña debe tener al menos 8 caracteres e incluir mayúscula, minúscula y número'
		);
	});
});