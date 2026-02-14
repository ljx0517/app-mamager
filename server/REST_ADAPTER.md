# REST 到 tRPC 适配层文档

## 概述

REST适配层为移动端提供了传统的REST API接口，同时后端继续使用tRPC架构。适配层将REST请求转换为tRPC调用，保持移动端接口不变。

## 接口映射

### 订阅接口
- `POST /api/subscription/verify` → `subscription.verify` (protected)
- `GET /api/subscription/status` → `subscription.status` (protected)
- `POST /api/subscription/restore` → `subscription.restore` (protected)

### AI接口
- `POST /api/ai/generate` → `ai.generate` (protected)
- `GET /api/ai/models` → `ai.models` (protected)

### 用户接口
- `POST /api/user/register` → `user.register` (app)
- `POST /api/user/refresh` → `user.refresh` (protected)
- `POST /api/user/login` → `user.loginWithEmail` (app)
- `GET /api/user/me` → `user.me` (protected)
- `POST /api/user/register-with-email` → `user.registerWithEmail` (app)

## 认证头转换

### REST请求头 → tRPC上下文
- `x-api-key` → `ctx.app` (App级别认证)
- `x-device-id` → `ctx.deviceId` (用户设备标识)
- `Authorization: Bearer <token>` → `ctx.authorization` (JWT认证)

### 认证级别
1. **App级别认证**：需要有效的 `x-api-key`
2. **用户级别认证**：需要 `x-api-key` + `x-device-id` 或 `Authorization: Bearer <token>`

## 错误映射

| tRPC错误码 | HTTP状态码 | 描述 |
|------------|------------|------|
| UNAUTHORIZED | 401 | 认证失败 |
| FORBIDDEN | 403 | 权限不足 |
| NOT_FOUND | 404 | 资源不存在 |
| BAD_REQUEST | 400 | 请求参数无效 |
| TOO_MANY_REQUESTS | 429 | 请求过于频繁 |
| CONFLICT | 409 | 资源冲突 |
| INTERNAL_SERVER_ERROR | 500 | 服务器内部错误 |

## 响应格式

### 成功响应
```json
{
  "success": true,
  "data": {
    // 具体业务数据
  }
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "无效的API Key"
  }
}
```

## 使用示例

### 用户注册
```bash
curl -X POST http://localhost:3000/api/user/register \
  -H "x-api-key: your_app_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device_123",
    "email": "user@example.com"
  }'
```

### 查询订阅状态
```bash
curl -X GET http://localhost:3000/api/subscription/status \
  -H "x-api-key: your_app_api_key" \
  -H "x-device-id: device_123"
```

### AI回复生成
```bash
curl -X POST http://localhost:3000/api/ai/generate \
  -H "x-api-key: your_app_api_key" \
  -H "x-device-id: device_123" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "你好，请帮我写一封感谢信",
    "stylePrompt": "友好且专业"
  }'
```

## 实现文件

- `src/routers/rest-adapter.ts` - REST适配层主文件
- `src/index.ts` - 服务入口，已集成适配层

## 开发说明

### 添加新接口
1. 在 `rest-adapter.ts` 中添加新的路由处理函数
2. 映射到对应的tRPC procedure
3. 确保正确处理认证和错误映射

### 测试
- 健康检查：`GET /api/health`
- 使用cURL或Postman测试各接口
- 验证认证头转换是否正确

## 性能考虑

当前实现为简化版本，后续可优化：
1. 直接调用tRPC内部方法，减少HTTP开销
2. 添加请求缓存
3. 优化错误处理性能

## 与移动端协作

1. 移动端继续使用现有的REST API路径
2. 认证头保持不变
3. 响应格式统一为 `{success, data, error}` 结构
4. 错误码映射为HTTP状态码