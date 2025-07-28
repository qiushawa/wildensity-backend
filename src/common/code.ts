export interface ResponseCodeValue {
    code: number
    message: string
};

export const RESPONSE_CODE = {
    SUCCESS: { code: 200, message: '成功' },
    CREATED: { code: 201, message: '建立成功' },
    BAD_REQUEST: { code: 400, message: '錯誤的請求格式' },
    UNAUTHORIZED: { code: 401, message: '未授權，請登入' },
    FORBIDDEN: { code: 403, message: '拒絕存取，權限不足' },
    NOT_FOUND: { code: 404, message: '找不到資源' },
    INTERNAL_SERVER_ERROR: { code: 500, message: '伺服器內部錯誤' }
};