import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('property')
export class PropertyEntity extends CommonEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  address: string;

  @Column('varchar')
  latitude: string;

  @Column('varchar')
  longitude: string;

  @Column('varchar')
  purpose: string;

  @Column('varchar')
  floor: string;

  @Column('decimal', { precision: 10, scale: 2 })
  size_sqm: number;

  @Column('text')
  description: string;

  @Column('text')
  building_info: string;

  @Column('varchar', { nullable: true })
  nearest_station: string;

  @Column('varchar', { nullable: true })
  distance_to_station: string;

  @Column('int')
  monthly_rent: number;

  @Column('int')
  deposit: number;

  @Column('int')
  key_money: number;

  @Column('int')
  maintenance_fee: number;

  @Column('text')
  agent_comment: string;

  @Column('varchar')
  rental_status: string;

  @Column('varchar')
  available_date: string;

  @Column('varchar')
  parking_info: string;

  @Column('varchar')
  bathroom_info: string;

  @Column('int')
  elavator_count: number;

  @Column('varchar')
  heating_type: string;

  @Column('varchar')
  direction: string;

  @Column('varchar')
  property_registry: string;
}
