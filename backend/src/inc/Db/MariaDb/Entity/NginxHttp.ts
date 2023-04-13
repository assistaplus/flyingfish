import {BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn} from 'typeorm';
import {ServerXFrameOptions} from '../../../Nginx/Config/Server.js';

/**
 * NginxHttp
 */
@Entity({name: 'nginx_http'})
export class NginxHttp extends BaseEntity {

    /**
     * id
     */
    @PrimaryGeneratedColumn()
    public id!: number;

    /**
     * domain id
     */
    @Index()
    @Column()
    public domain_id!: number;

    /**
     * listen id
     */
    @Index()
    @Column()
    public listen_id!: number;

    /**
     * index
     */
    @Column({
        default: 0
    })
    public index!: number;

    /**
     * ssl enable
     */
    @Column({
        default: false
    })
    public ssl_enable!: boolean;

    /**
     * http2 enable
     */
    @Column({
        default: false
    })
    public http2_enable!: boolean;

    /**
     * cert provider
     */
    @Column({
        default: ''
    })
    public cert_provider!: string;

    /**
     * cert email
     */
    @Column({
        default: ''
    })
    public cert_email!: string;

    /**
     * cert last update
     */
    @Column({
        default: 0
    })
    public cert_lastupdate!: number;

    /**
     * cert last request
     */
    @Column({
        default: 0
    })
    public cert_last_request!: number;

    /**
     * cert create attempts
     */
    @Column({
        default: 0
    })
    public cert_create_attempts!: number;

    /**
     * x-frame-options
     */
    @Column({
        default: ServerXFrameOptions.deny
    })
    public x_frame_options!: string;

    /**
     * well-known disabled
     */
    @Column({
        default: false
    })
    public wellknown_disabled!: boolean;

}