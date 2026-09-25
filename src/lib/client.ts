/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/** AudioStatus */
export enum AudioStatus {
  Pending = "pending",
  Processing = "processing",
  Completed = "completed",
  Failed = "failed",
}

/** AudioFileData */
export interface AudioFileData {
  /** File Url */
  file_url: string;
}

/** AudioRead */
export interface AudioRead {
  /**
   * Id
   * @format uuid
   */
  id: string;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /**
   * Updated At
   * @format date-time
   */
  updated_at: string;
  /** Name */
  name: string;
  /** Duration */
  duration: number;
  /** Credits Used */
  credits_used: number;
  status: AudioStatus;
  /** User List */
  user_list: string[] | null;
  /** Use Beep */
  use_beep: boolean;
  /** Sound Effect Id */
  sound_effect_id: string | null;
}

/** Body_add_sound_effect */
export interface BodyAddSoundEffect {
  /** File */
  file: File | Blob;
}

/** Body_submit_audio */
export interface BodySubmitAudio {
  /** Options */
  options?: string;
  /** File */
  file: File | Blob;
}

/** CensorOptions */
export interface CensorOptions {
  /** User List */
  user_list?: string[] | null;
  /**
   * Use Beep
   * @default false
   */
  use_beep?: boolean;
  /** Sound Effect Id */
  sound_effect_id?: string | null;
}

/** CheckoutSessionCreate */
export interface CheckoutSessionCreate {
  /**
   * Amount
   * @default "0.5"
   */
  amount?: number | string;
}

/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/** SoundEffectRead */
export interface SoundEffectRead {
  /**
   * Id
   * @format uuid
   */
  id: string;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /** Name */
  name: string;
}

/** SubtitleOptions */
export interface SubtitleOptions {
  /**
   * Symbol
   * Symbol to use for censoring words in subtitles. If more than one character is provided, it will fill mask positions randomly.
   * @maxLength 32
   * @default "*"
   */
  symbol?: string;
  /**
   * Visible Chars
   * Number of characters to keep visible at the start of the censored word
   * @default 1
   */
  visible_chars?: number;
}

/** UserRead */
export interface UserRead {
  /**
   * Id
   * @format uuid
   */
  id: string;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /** Email */
  email: string;
  /** Credits */
  credits: number;
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
  /** Input */
  input?: any;
  /** Context */
  ctx?: object;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title FastAPI
 * @version 0.1.0
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  me = {
    /**
     * No description
     *
     * @tags User
     * @name ReadUser
     * @summary Read User
     * @request GET:/me
     * @secure
     */
    readUser: (params: RequestParams = {}) =>
      this.request<UserRead, any>({
        path: `/me`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  user = {
    /**
     * No description
     *
     * @tags User
     * @name CreateCheckout
     * @summary Create Checkout
     * @request POST:/user/checkout
     * @secure
     */
    createCheckout: (data: CheckoutSessionCreate, params: RequestParams = {}) =>
      this.request<any, HTTPValidationError>({
        path: `/user/checkout`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  audio = {
    /**
     * No description
     *
     * @tags Audio
     * @name ReadAllAudios
     * @summary Read All Audios
     * @request GET:/audio/
     * @secure
     */
    readAllAudios: (params: RequestParams = {}) =>
      this.request<AudioRead[], any>({
        path: `/audio/`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Audio
     * @name SubmitAudio
     * @summary Submit Audio
     * @request POST:/audio/
     * @secure
     */
    submitAudio: (data: BodySubmitAudio, params: RequestParams = {}) =>
      this.request<any, HTTPValidationError>({
        path: `/audio/`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Audio
     * @name ReadAudio
     * @summary Read Audio
     * @request GET:/audio/{id}
     * @secure
     */
    readAudio: (id: string, params: RequestParams = {}) =>
      this.request<AudioRead, HTTPValidationError>({
        path: `/audio/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Audio
     * @name UpdateAudio
     * @summary Update Audio
     * @request PATCH:/audio/{id}
     * @secure
     */
    updateAudio: (
      id: string,
      data: CensorOptions,
      params: RequestParams = {},
    ) =>
      this.request<AudioRead, HTTPValidationError>({
        path: `/audio/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Audio
     * @name DownloadSubtitle
     * @summary Download Subtitle
     * @request POST:/audio/{id}/subtitle
     * @secure
     */
    downloadSubtitle: (
      id: string,
      data: SubtitleOptions,
      params: RequestParams = {},
    ) =>
      this.request<any, HTTPValidationError>({
        path: `/audio/${id}/subtitle`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Audio
     * @name DownloadAudio
     * @summary Download Audio
     * @request GET:/audio/{id}/download
     * @secure
     */
    downloadAudio: (id: string, params: RequestParams = {}) =>
      this.request<AudioFileData, HTTPValidationError>({
        path: `/audio/${id}/download`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  sfx = {
    /**
     * No description
     *
     * @tags Sound Effects
     * @name ReadAllSoundEffects
     * @summary Read All Sound Effects
     * @request GET:/sfx/
     * @secure
     */
    readAllSoundEffects: (params: RequestParams = {}) =>
      this.request<SoundEffectRead[], any>({
        path: `/sfx/`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sound Effects
     * @name AddSoundEffect
     * @summary Add Sound Effect
     * @request POST:/sfx/
     * @secure
     */
    addSoundEffect: (data: BodyAddSoundEffect, params: RequestParams = {}) =>
      this.request<SoundEffectRead, HTTPValidationError>({
        path: `/sfx/`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),
  };
}
