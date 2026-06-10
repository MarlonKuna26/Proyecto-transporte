"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const VehicleDTO_1 = require("../../src/modules/users/application/dtos/VehicleDTO");
describe('DTO de Vehículos', () => {
    it('Crear vehículo correctamente', () => {
        const dto = new VehicleDTO_1.CreateVehicleDTO({
            plate: 'ABC-123',
            brand: 'Toyota',
            model: 'Corolla',
            color: 'Rojo',
            year: 2020,
            capacity: 4,
            photoUrl: 'foto.png',
        });
        expect(dto.plate).toBe('ABC-123');
        expect(dto.brand).toBe('Toyota');
        expect(dto.model).toBe('Corolla');
        expect(dto.color).toBe('Rojo');
        expect(dto.year).toBe(2020);
        expect(dto.capacity).toBe(4);
        expect(dto.photoUrl).toBe('foto.png');
    });
    it('Asignar capacidad por defecto cuando no se envía', () => {
        const dto = new VehicleDTO_1.CreateVehicleDTO({
            plate: 'ABC-123',
            brand: 'Toyota',
            model: 'Corolla',
            color: 'Rojo',
        });
        expect(dto.capacity).toBe(4);
    });
    it('Lanzar error si faltan campos obligatorios', () => {
        expect(() => {
            new VehicleDTO_1.CreateVehicleDTO({
                plate: '',
                brand: '',
                model: '',
                color: '',
                capacity: 4,
            });
        }).toThrow('La placa, marca, modelo y color son obligatorios');
    });
    it('Lanzar error si la capacidad es inválida', () => {
        expect(() => {
            new VehicleDTO_1.CreateVehicleDTO({
                plate: 'ABC-123',
                brand: 'Toyota',
                model: 'Corolla',
                color: 'Rojo',
                capacity: 20,
            });
        }).toThrow('La capacidad debe estar entre 1 y 8');
    });
    it('Actualizar vehículo parcialmente', () => {
        const dto = new VehicleDTO_1.UpdateVehicleDTO({
            plate: 'XYZ-999',
            brand: 'Nissan',
            capacity: 5,
        });
        expect(dto.plate).toBe('XYZ-999');
        expect(dto.brand).toBe('Nissan');
        expect(dto.capacity).toBe(5);
        expect(dto.model).toBeUndefined();
        expect(dto.color).toBeUndefined();
    });
    it('Actualizar vehículo con datos vacíos', () => {
        const dto = new VehicleDTO_1.UpdateVehicleDTO({});
        expect(dto.plate).toBeUndefined();
        expect(dto.brand).toBeUndefined();
        expect(dto.model).toBeUndefined();
        expect(dto.color).toBeUndefined();
        expect(dto.capacity).toBeUndefined();
    });
});
//# sourceMappingURL=vehicleDTO.test.js.map