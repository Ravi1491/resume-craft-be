import { ErrorCode, ResumeCraftException } from '../../exceptions';
import { CursorDataType } from '../../types';
import { LoggerFactory } from '../../logger';

const logger = LoggerFactory.getLogger('cursor.helper');

export const encodeCursor = (name: string, uuid: string): string => {
    if (!name || !uuid) {
        logger.debug({
            ref: 'encodeCursor: Invalid input parameters',
            data: { name, uuid },
        });
        throw new ResumeCraftException(ErrorCode.INVALID_INPUT);
    }

    try {
        const safeName = name.trim().substring(0, 30);
        const cursor = Buffer.from(JSON.stringify({ n: safeName, i: uuid })).toString('base64url');
        logger.debug({
            ref: 'encodeCursor: Successfully encoded cursor',
            data: { name: safeName },
        });
        return cursor;
    } catch (error) {
        logger.error({
            ref: `encodeCursor: Failed to encode cursor ${error.message}`,
            error,
            data: { name },
        });
        throw new ResumeCraftException(ErrorCode.INVALID_INPUT);
    }
};

export const decodeCursor = (cursor: string): CursorDataType => {
    if (!cursor || typeof cursor !== 'string') {
        logger.error({
            ref: 'decodeCursor: Invalid cursor input',
            data: { cursor },
        });
        throw new ResumeCraftException(ErrorCode.INVALID_INPUT);
    }

    try {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString());

        if (!decoded.n || !decoded.i) {
            logger.debug({
                ref: 'decodeCursor: Invalid cursor format',
                data: { decoded },
            });
            throw new ResumeCraftException(ErrorCode.INVALID_INPUT);
        }

        const result = {
            name: decoded.n,
            id: decoded.i,
        };
        logger.debug({
            ref: `decodeCursor: Successfully decoded cursor`,
            encodedName: decoded.n,
            id: decoded.i,
        });
        return result;
    } catch (error) {
        logger.error({
            ref: `decodeCursor: Failed to decode cursor ${error.message}`,
            data: { cursor },
        });
        throw new ResumeCraftException(ErrorCode.INVALID_INPUT);
    }
};
