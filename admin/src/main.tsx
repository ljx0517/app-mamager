import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

import { trpc, trpcClient, queryClient } from '@/utils/trpc'
import App from './App'
import './index.css'

dayjs.locale('zh-cn')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ConfigProvider
            locale={zhCN}
            theme={{
              token: {
                colorPrimary: '#1677ff',
                borderRadius: 8,
                colorBgContainer: '#ffffff',
              },
            }}
          >
            <App />
          </ConfigProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>,
)
