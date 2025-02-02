import { ApiProperty } from '@nestjs/swagger';
import { PropertyEntity } from 'src/entities/property.entity';

export class GetPropertyDetailDto {
  @ApiProperty({ description: 'id' })
  id: number;

  @ApiProperty({ description: '위도' })
  latitude: string;

  @ApiProperty({ description: '경도' })
  longitude: string;

  @ApiProperty({ description: '부동산 용도' })
  purpose: string;

  @ApiProperty({ description: '보증금' })
  deposit: number;

  @ApiProperty({ description: '월세' })
  monthly_rent: number;

  @ApiProperty({ description: '권리금' })
  key_money: number;

  @ApiProperty({ description: '관리비' })
  maintenance_fee: number;

  @ApiProperty({ description: '전용 면적(제곱미터)' })
  size_sqm: number;

  @ApiProperty({ description: '평수' })
  size: number;

  @ApiProperty({ description: '설명' })
  description: string;

  @ApiProperty({ description: '층수' })
  floor: string;

  @ApiProperty({ description: '가장 가까운 지하철역' })
  nearest_station: string;

  @ApiProperty({ description: '가장 가까운 지하철역과의 거리' })
  distance_to_station: string;

  @ApiProperty({ description: '중개사 코멘트' })
  agent_comment: string;

  @ApiProperty({ description: '임대 상태' })
  rental_status: string;

  @ApiProperty({ description: '입주 가능일' })
  available_date: string;

  @ApiProperty({ description: '주차 가능 / 총 주차' })
  parking_info: string;

  @ApiProperty({ description: '난방' })
  heating_type: string;

  @ApiProperty({ description: '방향' })
  direction: string;

  @ApiProperty({ description: '등기부 등본' })
  property_registry: string;

  @ApiProperty({ description: '화장실 정보' })
  bathroom_info: string;

  @ApiProperty({ description: '건물 정보' })
  building_info: string;

  @ApiProperty({ description: '엘리베이터 개수' })
  elevator_count: number;

  constructor(property: PropertyEntity) {
    this.latitude = property.latitude;
    this.longitude = property.longitude;
    this.purpose = property.purpose;
    this.deposit = property.deposit;
    this.monthly_rent = property.monthly_rent;
    this.key_money = property.key_money;
    this.maintenance_fee = property.maintenance_fee;
    this.size_sqm = property.size_sqm;
    this.size = Math.floor(property.size_sqm / 3.3058);
    this.description = property.description;
    this.floor = property.floor;
    this.nearest_station = property.nearest_station;
    this.distance_to_station = property.distance_to_station;
    this.agent_comment = property.agent_comment;
    this.rental_status = property.rental_status;
    this.available_date = property.available_date;
    this.parking_info = property.parking_info;
    this.heating_type = property.heating_type;
    this.direction = property.direction;
    this.property_registry = property.property_registry;
    this.bathroom_info = property.bathroom_info;
    this.building_info = property.building_info;
    this.elevator_count = property.elavator_count;
  }
}
