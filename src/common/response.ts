import { Response } from 'express'
import { RESPONSE_CODE, ResponseCodeValue } from './code'

interface ResponseData {
	code: number
	message: string
	data?: any
}

export const successResponse = (
	res: Response,
	codeValue: ResponseCodeValue = RESPONSE_CODE.SUCCESS,
	data?: any,
	message?: string
): void => {
	const responseData: ResponseData = { code: codeValue.code, message: message || codeValue.message, ...(data && { data }) }
	res.status(codeValue.code).json(responseData)
}

export const errorResponse = (
	res: Response,
	codeValue: ResponseCodeValue = RESPONSE_CODE.INTERNAL_SERVER_ERROR,
	message = '',
	data?: any
): void => {

	const responseData: ResponseData = {
		code: codeValue.code,
		message: message || codeValue.message,
		...(data && { data }),
	}
	res.status(codeValue.code).json(responseData)
}
