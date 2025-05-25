"use client"

import React, { useState, useRef, useEffect } from 'react'
import emailjs from '@emailjs/browser'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Mail,
  Upload,
  Plus,
  Trash2,
  Edit,
  Eye,
  Send,
  Users,
  Calendar,
  MapPin,
  Clock,
  FileSpreadsheet,
  Check,
  X,
  Copy,
  Download,
  Settings,
  Sparkles,
  History,
  Search
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmailContact {
  id: string
  email: string
  name?: string
  selected: boolean
  isValid?: boolean
  validationError?: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  type: 'modern' | 'classic' | 'minimal' | 'colorful'
}

interface EmailHistory {
  id: string
  timestamp: Date
  match: {
    homeTeam: string
    awayTeam: string
    date: string
    time: string
    venue: string
  }
  template: {
    name: string
    subject: string
  }
  recipients: {
    email: string
    name?: string
    status: 'success' | 'failed'
  }[]
  totalSent: number
  totalFailed: number
}

interface MatchEmailNotificationProps {
  match: {
    id: string
    homeTeam: string
    awayTeam: string
    date: string
    time: string
    venue: string
    description?: string
  }
  onClose: () => void
}

export default function MatchEmailNotification({ match, onClose }: MatchEmailNotificationProps) {
  const [contacts, setContacts] = useState<EmailContact[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [customSubject, setCustomSubject] = useState('')
  const [customContent, setCustomContent] = useState('')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [activeTab, setActiveTab] = useState('contacts')
  const [isUploadingExcel, setIsUploadingExcel] = useState(false)
  const [sendProgress, setSendProgress] = useState(0)
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [editingContact, setEditingContact] = useState<string | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [editName, setEditName] = useState('')
  const [showEmailConfig, setShowEmailConfig] = useState(false)
  const [emailConfig, setEmailConfig] = useState({
    serviceId: 'service_fchcmust',
    templateId: 'template_7bjhoc1',
    publicKey: '0bycLKgniu_gbwkyP'
  })
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [historySearchTerm, setHistorySearchTerm] = useState('')
  const [clearContactsAfterSend, setClearContactsAfterSend] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load data from localStorage on component mount
  useEffect(() => {
    try {
      // Load contacts
      const savedContacts = localStorage.getItem('fchcmust-email-contacts')
      if (savedContacts) {
        setContacts(JSON.parse(savedContacts))
      }

      // Load email config
      const savedEmailConfig = localStorage.getItem('fchcmust-email-config')
      if (savedEmailConfig) {
        setEmailConfig(JSON.parse(savedEmailConfig))
      }

      // Load email history with date parsing - filter by current match
      const savedEmailHistory = localStorage.getItem('fchcmust-email-history')
      if (savedEmailHistory) {
        const parsedHistory = JSON.parse(savedEmailHistory)
        // Convert timestamp strings back to Date objects and filter by matchId
        const historyWithDates = parsedHistory
          .map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp),
            matchId: entry.matchId || 'unknown' // Handle old entries without matchId
          }))
          .filter((entry: any) => entry.matchId === match.id) // Only load history for current match

        setEmailHistory(historyWithDates)
        console.log('📂 Loading email history for match:', match.id)
        console.log('📂 Found', historyWithDates.length, 'entries for this match')
        console.log('📂 Match details:', `${match.homeTeam} vs ${match.awayTeam}`)
        if (historyWithDates.length > 0) {
          console.log('📂 Latest history entry:', historyWithDates[0])
        }
      } else {
        console.log('📂 No email history found in localStorage')
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error)
    }
  }, [match.id]) // Add match.id dependency to reload when switching matches

  // Save contacts to localStorage whenever contacts change
  useEffect(() => {
    try {
      localStorage.setItem('fchcmust-email-contacts', JSON.stringify(contacts))
    } catch (error) {
      console.error('Error saving contacts to localStorage:', error)
    }
  }, [contacts])

  // Save email config to localStorage whenever config changes
  useEffect(() => {
    try {
      localStorage.setItem('fchcmust-email-config', JSON.stringify(emailConfig))
    } catch (error) {
      console.error('Error saving email config to localStorage:', error)
    }
  }, [emailConfig])

  // Note: Email history is saved directly in saveEmailHistory function to avoid overwriting global history

  // Predefined email templates
  const emailTemplates: EmailTemplate[] = [
    {
      id: 'modern',
      name: 'Modern Sports',
      type: 'modern',
      subject: '⚽ Trận đấu hấp dẫn: {homeTeam} vs {awayTeam} - {date}',
      content: `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Thông tin trận đấu</title>
          <style>
            @media only screen and (max-width: 600px) {
              .container {
                width: 100% !important;
                padding: 10px !important;
              }
              .info-block {
                display: block !important;
                width: 100% !important;
                margin-bottom: 15px !important;
              }
            }
          </style>
        </head>
        <body style="margin:0; padding:0; font-family: 'Segoe UI', Tahoma, sans-serif; background: #f0f2f8;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 20px;">
            <tr>
              <td align="center">
                <table class="container" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius: 15px; overflow:hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea, #764ba2); color:white; padding:30px; text-align:center;">
                      <h1 style="margin:0; font-size: 24px;">⚽ TRẬN ĐẤU ĐỈNH CAO</h1>
                      <p style="margin:10px 0 0; font-size: 14px;">Đừng bỏ lỡ cơ hội xem trận đấu hấp dẫn!</p>
                    </td>
                  </tr>

                  <!-- Match Title -->
                  <tr>
                    <td style="padding: 30px; text-align:center;">
                      <div style="background:#f8f9ff; padding: 20px; border-radius: 15px; display:inline-block;">
                        <h2 style="margin: 0; color: #333; font-size: 20px;">{homeTeam} <span style="color:#667eea;">VS</span> {awayTeam}</h2>
                      </div>
                    </td>
                  </tr>

                  <!-- Match Info -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td class="info-block" width="33%" align="center" style="padding:10px;">
                            <div style="background:#ffffff; border-radius:10px; padding:15px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                              <div style="font-size:24px; color:#667eea;">📅</div>
                              <div style="font-weight:bold; color:#333;">{date}</div>
                            </div>
                          </td>
                          <td class="info-block" width="33%" align="center" style="padding:10px;">
                            <div style="background:#ffffff; border-radius:10px; padding:15px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                              <div style="font-size:24px; color:#667eea;">⏰</div>
                              <div style="font-weight:bold; color:#333;">{time}</div>
                            </div>
                          </td>
                          <td class="info-block" width="33%" align="center" style="padding:10px;">
                            <div style="background:#ffffff; border-radius:10px; padding:15px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                              <div style="font-size:24px; color:#667eea;">📍</div>
                              <div style="font-weight:bold; color:#333;">{venue}</div>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- CTA Button -->
                  <tr>
                    <td align="center" style="padding-bottom: 30px;">
                      <a href="#" style="display:inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color:white; padding:15px 30px; border-radius:30px; text-decoration:none; font-weight:bold; font-size:16px; box-shadow:0 6px 15px rgba(102,126,234,0.3);">
                        🎟️ Đặt vé ngay
                      </a>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#f8f9ff; padding:20px 30px; text-align:center; font-size:14px; color:#666;">
                      Cảm ơn bạn đã quan tâm đến trận đấu!<br>
                      Hãy đến sớm để có chỗ ngồi tốt nhất! ⚽
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    },
    {
      id: 'classic',
      name: 'Classic Elegant',
      type: 'classic',
      subject: 'Thông báo trận đấu: {homeTeam} vs {awayTeam} - {date}',
      content: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: white; border: 2px solid #2c3e50; border-radius: 10px;">
          <div style="background: #2c3e50; color: white; padding: 25px; text-align: center;">
            <h1 style="margin: 0; font-size: 26px;">THÔNG BÁO TRẬN ĐẤU</h1>
            <div style="width: 50px; height: 3px; background: #e74c3c; margin: 15px auto;"></div>
          </div>

          <div style="padding: 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #2c3e50; font-size: 22px; margin-bottom: 20px;">{homeTeam} vs {awayTeam}</h2>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #2c3e50;">📅 Ngày thi đấu:</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">{date}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #2c3e50;">⏰ Giờ thi đấu:</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">{time}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #2c3e50;">📍 Địa điểm:</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">{venue}</td>
              </tr>
            </table>

            <div style="background: #ecf0f1; padding: 20px; border-radius: 5px; margin-bottom: 25px;">
              <p style="margin: 0; color: #2c3e50; line-height: 1.6;">
                Kính mời quý khách đến tham dự và cổ vũ cho trận đấu hấp dẫn này.
                Hãy đến sớm để có được vị trí tốt nhất!
              </p>
            </div>

            <div style="text-align: center;">
              <a href="#" style="display: inline-block; background: #e74c3c; color: white; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold;">
                Xác nhận tham dự
              </a>
            </div>
          </div>

          <div style="background: #ecf0f1; padding: 15px; text-align: center; border-top: 1px solid #bdc3c7;">
            <p style="margin: 0; color: #7f8c8d; font-size: 12px;">
              © 2024 FCHCMUST - Câu lạc bộ bóng đá
            </p>
          </div>
        </div>
      `
    },
    {
      id: 'minimal',
      name: 'Minimal Clean',
      type: 'minimal',
      subject: '{homeTeam} vs {awayTeam} - {date}',
      content: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; background: white;">
          <div style="padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 300; color: #333; letter-spacing: -1px;">
                {homeTeam}<br>
                <span style="font-size: 18px; color: #999; font-weight: 400;">vs</span><br>
                {awayTeam}
              </h1>
            </div>

            <div style="border-left: 3px solid #333; padding-left: 20px; margin-bottom: 30px;">
              <div style="margin-bottom: 10px;">
                <span style="color: #999; font-size: 14px;">NGÀY</span><br>
                <span style="color: #333; font-size: 16px; font-weight: 500;">{date}</span>
              </div>
              <div style="margin-bottom: 10px;">
                <span style="color: #999; font-size: 14px;">GIỜ</span><br>
                <span style="color: #333; font-size: 16px; font-weight: 500;">{time}</span>
              </div>
              <div>
                <span style="color: #999; font-size: 14px;">ĐỊA ĐIỂM</span><br>
                <span style="color: #333; font-size: 16px; font-weight: 500;">{venue}</span>
              </div>
            </div>

            <div style="text-align: center; margin-top: 40px;">
              <a href="#" style="display: inline-block; background: #333; color: white; padding: 12px 24px; text-decoration: none; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
                Tham gia
              </a>
            </div>
          </div>

          <div style="border-top: 1px solid #eee; padding: 20px; text-align: center;">
            <p style="margin: 0; color: #999; font-size: 12px;">
              Cảm ơn bạn đã quan tâm
            </p>
          </div>
        </div>
      `
    }
  ]

  // Validate email function
  const validateEmail = (email: string): { isValid: boolean, error?: string } => {
    if (!email.trim()) {
      return { isValid: false, error: 'Email không được để trống' }
    }

    if (!email.includes('@')) {
      return { isValid: false, error: 'Thiếu ký tự @' }
    }

    if (email.startsWith('@') || email.endsWith('@')) {
      return { isValid: false, error: 'Vị trí @ không hợp lệ' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Định dạng email không hợp lệ' }
    }

    return { isValid: true }
  }

  // Add email manually with validation
  const addEmail = () => {
    if (!newEmail.trim()) return

    const validation = validateEmail(newEmail)
    if (!validation.isValid) {
      alert(`Email không hợp lệ: ${validation.error}`)
      return
    }

    if (contacts.some(contact => contact.email.toLowerCase() === newEmail.toLowerCase())) {
      alert('Email đã tồn tại!')
      return
    }

    const newContact: EmailContact = {
      id: Date.now().toString(),
      email: newEmail.toLowerCase(),
      name: newName.trim() || undefined,
      selected: true,
      isValid: true
    }

    setContacts([...contacts, newContact])
    setNewEmail('')
    setNewName('')
  }

  // Delete selected emails
  const deleteSelectedEmails = () => {
    const selectedCount = contacts.filter(c => c.selected).length
    if (selectedCount === 0) {
      alert('Vui lòng chọn ít nhất một email để xóa!')
      return
    }

    if (confirm(`Bạn có chắc muốn xóa ${selectedCount} email đã chọn?`)) {
      setContacts(contacts.filter(contact => !contact.selected))
      alert(`Đã xóa ${selectedCount} email!`)
    }
  }

  // Delete invalid emails
  const deleteInvalidEmails = () => {
    const invalidCount = contacts.filter(c => c.isValid === false).length
    if (invalidCount === 0) {
      alert('Không có email không hợp lệ nào để xóa!')
      return
    }

    if (confirm(`Bạn có chắc muốn xóa ${invalidCount} email không hợp lệ?`)) {
      setContacts(contacts.filter(contact => contact.isValid !== false))
      alert(`Đã xóa ${invalidCount} email không hợp lệ!`)
    }
  }

  // Test EmailJS configuration
  const testEmailConfig = async () => {
    if (!emailConfig.serviceId || !emailConfig.publicKey || emailConfig.publicKey === 'YOUR_EMAILJS_PUBLIC_KEY') {
      alert('⚠️ Vui lòng cấu hình EmailJS trước khi test!')
      setShowEmailConfig(true)
      return
    }

    // Check if there are any contacts to test with
    const selectedContacts = contacts.filter(c => c.selected && c.isValid !== false)
    if (selectedContacts.length === 0) {
      alert('⚠️ Vui lòng thêm và chọn ít nhất một email để test!\n\nHãy vào tab "Danh sách email" để thêm email trước.')
      return
    }

    try {
      console.log('🧪 Testing EmailJS configuration...')
      console.log('🧪 EmailJS object:', emailjs)
      console.log('🧪 Service ID:', emailConfig.serviceId)
      console.log('🧪 Template ID:', emailConfig.templateId)
      console.log('🧪 Public Key length:', emailConfig.publicKey?.length)
      console.log('🧪 Selected contacts for test:', selectedContacts.map(c => c.email))

      // Check if emailjs is properly loaded
      if (!emailjs || typeof emailjs.send !== 'function') {
        throw new Error('EmailJS library not loaded properly')
      }

      // Initialize EmailJS with proper error handling
      try {
        emailjs.init({
          publicKey: emailConfig.publicKey,
          blockHeadless: true,
          limitRate: {
            id: 'app',
            throttle: 10000,
          },
        })
        console.log('🧪 EmailJS initialized successfully')
      } catch (initError) {
        console.error('🧪 EmailJS init error:', initError)
        throw new Error(`Failed to initialize EmailJS: ${initError}`)
      }

      // Create test HTML content with real match data
      const testHtmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Test Email</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
    <h1 style="color: #667eea; text-align: center; margin-bottom: 30px;">🧪 TEST EMAIL THÀNH CÔNG!</h1>

    <div style="background: #f8f9ff; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
      <h2 style="text-align: center; color: #333; margin-bottom: 20px;">
        ${match.homeTeam} <span style="color: #667eea;">VS</span> ${match.awayTeam}
      </h2>
      <div style="text-align: center; margin: 20px 0;">
        <p style="margin: 10px 0;"><strong>📅 Ngày:</strong> ${match.date}</p>
        <p style="margin: 10px 0;"><strong>⏰ Giờ:</strong> ${match.time}</p>
        <p style="margin: 10px 0;"><strong>📍 Địa điểm:</strong> ${match.venue}</p>
      </div>
    </div>

    <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; border-left: 4px solid #4caf50; margin: 20px 0;">
      <p style="margin: 0; color: #2e7d32; font-weight: bold;">
        ✅ Nếu bạn nhận được email này với thông tin trận đấu chính xác (không phải {homeTeam}),
        nghĩa là hệ thống đã hoạt động đúng!
      </p>
    </div>

    <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;">
      <p style="margin: 0; color: #856404;">
        <strong>🔍 Kiểm tra:</strong><br>
        • Có hiển thị "${match.homeTeam}" thay vì {homeTeam}?<br>
        • Có hiển thị "${match.awayTeam}" thay vì {awayTeam}?<br>
        • Có hiển thị "${match.date}" thay vì {date}?<br>
        • Có hiển thị "${match.time}" thay vì {time}?<br>
        • Có hiển thị "${match.venue}" thay vì {venue}?
      </p>
    </div>

    <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
      Email test từ FCHCMUST System<br>
      Template ID: ${emailConfig.templateId || 'template_simple'}
    </p>
  </div>
</body>
</html>`

      const templateId = emailConfig.templateId || 'template_simple'
      console.log(`🧪 Testing with Service ID: ${emailConfig.serviceId}`)
      console.log(`🧪 Testing with Template ID: ${templateId}`)

      let successCount = 0
      let failedEmails: string[] = []

      // Send test email to all selected contacts
      for (let i = 0; i < selectedContacts.length; i++) {
        const contact = selectedContacts[i]

        try {
          // Test with match data for each contact
          const testParams = {
            to_email: contact.email,
            to_name: contact.name || 'Test User',
            from_name: 'FCHCMUST - Test',
            reply_to: 'noreply@fchcmust.com',
            subject: `🧪 Test: ${match.homeTeam} vs ${match.awayTeam} - ${match.date}`,
            html_content: testHtmlContent
          }

          console.log(`🧪 Sending test email to: ${contact.email}`)
          console.log('🧪 Test params:', testParams)

          // Send test email with timeout
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
          })

          const sendPromise = emailjs.send(
            emailConfig.serviceId,
            templateId,
            testParams
          )

          const response = await Promise.race([sendPromise, timeoutPromise])
          console.log(`🧪 Test response for ${contact.email}:`, response)

          if (response && (response.status === 200 || response.text === 'OK')) {
            successCount++
            console.log(`✅ Test email sent successfully to: ${contact.email}`)
          } else {
            failedEmails.push(contact.email)
            console.error(`❌ Failed to send test email to: ${contact.email}`, response)
          }
        } catch (emailError: any) {
          failedEmails.push(contact.email)
          console.error(`❌ Error sending test email to: ${contact.email}`, emailError)
        }

        // Small delay between emails
        if (i < selectedContacts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      // Show test results
      if (successCount === selectedContacts.length) {
        alert(`✅ Test thành công!

📧 Email test đã được gửi đến ${successCount} địa chỉ:
${selectedContacts.map(c => `• ${c.email}`).join('\n')}

🔍 Kiểm tra email và xác nhận:
• Có hiển thị "${match.homeTeam} VS ${match.awayTeam}" không?
• Có hiển thị ngày "${match.date}" không?
• Có hiển thị giờ "${match.time}" không?
• Có hiển thị địa điểm "${match.venue}" không?

✅ Nếu hiển thị đúng → Hệ thống hoạt động tốt!
❌ Nếu hiển thị {homeTeam} → Template EmailJS cần sửa!

📋 Template ID đang dùng: ${templateId}`)
      } else if (successCount > 0) {
        alert(`⚠️ Test một phần thành công!

✅ Thành công: ${successCount}/${selectedContacts.length} email
❌ Thất bại: ${failedEmails.join(', ')}

Vui lòng kiểm tra cấu hình và thử lại.`)
      } else {
        alert('❌ Test thất bại hoàn toàn! Vui lòng kiểm tra lại cấu hình.')
      }
    } catch (error: any) {
      console.error('🧪 Test error details:', {
        error,
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        response: error?.response,
        status: error?.status
      })

      let errorMessage = 'Unknown error'
      if (error?.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error?.text) {
        errorMessage = error.text
      }

      alert(`❌ Test thất bại!\n\nLỗi: ${errorMessage}\n\nVui lòng kiểm tra:\n1. Service ID có đúng không?\n2. Template ID có tồn tại không?\n3. Public Key có đúng không?\n4. Email Service có được kích hoạt không?`)
    }
  }

  // Remove email
  const removeEmail = (id: string) => {
    setContacts(contacts.filter(contact => contact.id !== id))
  }

  // Toggle email selection
  const toggleEmailSelection = (id: string) => {
    setContacts(contacts.map(contact =>
      contact.id === id ? { ...contact, selected: !contact.selected } : contact
    ))
  }

  // Select all emails
  const selectAllEmails = () => {
    setContacts(contacts.map(contact => ({ ...contact, selected: true })))
  }

  // Deselect all emails
  const deselectAllEmails = () => {
    setContacts(contacts.map(contact => ({ ...contact, selected: false })))
  }

  // Enhanced Excel file upload with proper XLSX library
  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingExcel(true)

    try {
      const newContacts: EmailContact[] = []
      const invalidEmails: { row: number, email: string, reason: string }[] = []
      const duplicateEmails: { row: number, email: string }[] = []
      let data: any[][] = []

      // Check file type and process accordingly
      if (file.name.toLowerCase().endsWith('.csv')) {
        // Handle CSV files with proper encoding
        const text = await file.text()
        const lines = text.split('\n')
        data = lines.map(line => {
          const parts = line.split(/[,;\t]/).map(s => s.trim().replace(/"/g, ''))
          return parts
        })
      } else {
        // Handle Excel files (.xlsx, .xls) with XLSX library
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, {
          type: 'array',
          codepage: 65001 // UTF-8 encoding
        })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // Convert to array of arrays with proper handling
        data = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          raw: false // This ensures text values are properly converted
        })
      }

      console.log('📊 Parsed data from Excel:', data) // Debug log

      // Process the data
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        if (!row || row.length === 0) continue

        const email = String(row[0] || '').trim()
        const name = String(row[1] || '').trim()

        console.log(`📧 Processing row ${i + 1}: email="${email}", name="${name}"`) // Debug log

        if (!email) continue

        // Validate email and add to list (even if invalid for user to fix)
        const validation = validateEmail(email)

        if (!validation.isValid) {
          invalidEmails.push({
            row: i + 1,
            email: email,
            reason: validation.error || 'Không hợp lệ'
          })

          // Add invalid email to list for user to edit
          if (!contacts.some(c => c.email.toLowerCase() === email.toLowerCase()) &&
              !newContacts.some(c => c.email.toLowerCase() === email.toLowerCase())) {
            newContacts.push({
              id: `${Date.now()}-${i}`,
              email: email,
              name: name || undefined,
              selected: false, // Don't select invalid emails by default
              isValid: false,
              validationError: validation.error
            })
          }
          continue
        }

        // Check for duplicates in existing contacts
        if (contacts.some(c => c.email.toLowerCase() === email.toLowerCase())) {
          duplicateEmails.push({
            row: i + 1,
            email: email
          })
          continue
        }

        // Check for duplicates in new contacts
        if (newContacts.some(c => c.email.toLowerCase() === email.toLowerCase())) {
          duplicateEmails.push({
            row: i + 1,
            email: email
          })
          continue
        }

        // Add valid email
        newContacts.push({
          id: `${Date.now()}-${i}`,
          email: email.toLowerCase(),
          name: name || undefined,
          selected: true,
          isValid: true
        })
      }

      // Show detailed results
      let resultMessage = ''
      const validEmails = newContacts.filter(c => c.isValid !== false)
      const invalidEmailsAdded = newContacts.filter(c => c.isValid === false)

      if (newContacts.length > 0) {
        setContacts([...contacts, ...newContacts])

        if (validEmails.length > 0) {
          resultMessage += `✅ Đã thêm ${validEmails.length} email hợp lệ!\n\n`
        }

        if (invalidEmailsAdded.length > 0) {
          resultMessage += `🔧 Đã thêm ${invalidEmailsAdded.length} email không hợp lệ để bạn chỉnh sửa:\n`
          invalidEmailsAdded.slice(0, 3).forEach(contact => {
            resultMessage += `• "${contact.email}" - ${contact.validationError}\n`
          })
          if (invalidEmailsAdded.length > 3) {
            resultMessage += `... và ${invalidEmailsAdded.length - 3} email khác\n`
          }
          resultMessage += '\n💡 Bạn có thể chỉnh sửa hoặc xóa các email không hợp lệ bằng nút "Xóa không hợp lệ"\n\n'
        }
      }

      if (duplicateEmails.length > 0) {
        resultMessage += `⚠️ ${duplicateEmails.length} email trùng lặp (đã bỏ qua):\n`
        duplicateEmails.slice(0, 3).forEach(item => {
          resultMessage += `• Dòng ${item.row}: "${item.email}"\n`
        })
        if (duplicateEmails.length > 3) {
          resultMessage += `... và ${duplicateEmails.length - 3} email khác\n`
        }
        resultMessage += '\n'
      }

      if (newContacts.length === 0 && duplicateEmails.length === 0) {
        resultMessage = '❌ Không tìm thấy email nào trong file!\n\nĐịnh dạng file Excel:\n• Cột A: Email\n• Cột B: Tên (tùy chọn)\n\nHỗ trợ định dạng: CSV, Excel (.xlsx, .xls)\nPhân cách: dấu phẩy (,), chấm phẩy (;), tab'
      }

      alert(resultMessage)

    } catch (error) {
      console.error('Error reading Excel file:', error)
      alert('❌ Lỗi khi đọc file Excel!\n\nVui lòng kiểm tra:\n• File có đúng định dạng .xlsx, .xls, .csv\n• Cột A chứa email\n• Cột B chứa tên (tùy chọn)')
    } finally {
      setIsUploadingExcel(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Save email to history
  const saveEmailHistory = (recipients: { email: string, name?: string, status: 'success' | 'failed' }[], templateUsed: EmailTemplate | null, customSubjectUsed: string, successCount: number, failedCount: number) => {
    const historyEntry: EmailHistory = {
      id: Date.now().toString(),
      timestamp: new Date(),
      matchId: match.id, // Add matchId to link history to specific match
      match: {
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        date: match.date,
        time: match.time,
        venue: match.venue
      },
      template: {
        name: templateUsed?.name || 'Custom Template',
        subject: customSubjectUsed || templateUsed?.subject || 'Custom Subject'
      },
      recipients,
      totalSent: successCount,
      totalFailed: failedCount
    }

    console.log('💾 Saving email history entry for match:', match.id, historyEntry)

    // Update current match history
    setEmailHistory(prev => {
      const newHistory = [historyEntry, ...prev]
      console.log('💾 New history length for this match:', newHistory.length)
      return newHistory
    })

    // Also save to global localStorage (all matches)
    try {
      const savedEmailHistory = localStorage.getItem('fchcmust-email-history')
      const allHistory = savedEmailHistory ? JSON.parse(savedEmailHistory) : []
      const updatedAllHistory = [historyEntry, ...allHistory]
      localStorage.setItem('fchcmust-email-history', JSON.stringify(updatedAllHistory))
      console.log('💾 Email history saved to localStorage. Total entries:', updatedAllHistory.length)
    } catch (error) {
      console.error('❌ Error saving email history to localStorage:', error)
    }
  }

  // Send emails using EmailJS
  const sendEmails = async () => {
    const selectedContacts = contacts.filter(c => c.selected)
    if (selectedContacts.length === 0) {
      alert('Vui lòng chọn ít nhất một email để gửi!')
      return
    }

    if (!selectedTemplate && !customContent) {
      alert('Vui lòng chọn mẫu email hoặc nhập nội dung tùy chỉnh!')
      return
    }

    // Check EmailJS configuration
    if (!emailConfig.serviceId || !emailConfig.publicKey || emailConfig.publicKey === 'YOUR_EMAILJS_PUBLIC_KEY') {
      alert('⚠️ Vui lòng cấu hình EmailJS trước khi gửi email!\n\nClick vào nút "Cấu hình Email" để thiết lập.')
      setShowEmailConfig(true)
      return
    }

    setIsSending(true)
    setSendStatus('sending')
    setSendProgress(0)

    try {
      const emailSubject = (customSubject || selectedTemplate?.subject || '')
        .replace('{homeTeam}', match.homeTeam)
        .replace('{awayTeam}', match.awayTeam)
        .replace('{date}', match.date)
        .replace('{time}', match.time)
        .replace('{venue}', match.venue)

      const emailContent = customContent || selectedTemplate?.content || ''

      let successCount = 0
      let failedEmails: string[] = []
      const recipients: { email: string, name?: string, status: 'success' | 'failed' }[] = []

      // Send emails one by one using EmailJS
      for (let i = 0; i < selectedContacts.length; i++) {
        const contact = selectedContacts[i]

        try {
          // Prepare complete HTML email content
          const completeHtmlContent = emailContent
            .replace(/{homeTeam}/g, match.homeTeam)
            .replace(/{awayTeam}/g, match.awayTeam)
            .replace(/{date}/g, match.date)
            .replace(/{time}/g, match.time)
            .replace(/{venue}/g, match.venue)

          console.log(`🔄 Original content preview:`, emailContent.substring(0, 200) + '...')
          console.log(`🔄 After replacement preview:`, completeHtmlContent.substring(0, 200) + '...')
          console.log(`🔄 Match data:`, {
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            date: match.date,
            time: match.time,
            venue: match.venue
          })

          console.log(`\n📧 [${i + 1}/${selectedContacts.length}] Preparing email for: ${contact.email}`)
          console.log(`🔧 Service ID: ${emailConfig.serviceId}`)
          console.log(`🔧 Template ID: ${emailConfig.templateId || 'None'}`)
          console.log(`🔧 Public Key: ${emailConfig.publicKey ? 'Set (' + emailConfig.publicKey.substring(0, 8) + '...)' : 'Not set'}`)

          // Initialize EmailJS with proper configuration
          try {
            emailjs.init({
              publicKey: emailConfig.publicKey,
              blockHeadless: true,
              limitRate: {
                id: 'app',
                throttle: 1000, // 1 second between emails
              },
            })
          } catch (initError) {
            console.error('📧 EmailJS init error:', initError)
            throw new Error(`Failed to initialize EmailJS: ${initError}`)
          }

          // Prepare template parameters with unique identifiers
          const templateParams = {
            to_email: contact.email,
            to_name: contact.name || 'Fan bóng đá',
            from_name: 'FCHCMUST - Câu lạc bộ bóng đá',
            reply_to: 'noreply@fchcmust.com',
            subject: emailSubject,
            html_content: completeHtmlContent,
            // Add unique identifier to prevent caching issues
            timestamp: Date.now(),
            recipient_id: contact.id
          }

          console.log(`📋 Template params for ${contact.email}:`, {
            to_email: templateParams.to_email,
            to_name: templateParams.to_name,
            subject: templateParams.subject,
            timestamp: templateParams.timestamp,
            recipient_id: templateParams.recipient_id
          })

          // Send email using EmailJS with retry mechanism
          let response
          let retryCount = 0
          const maxRetries = 2

          while (retryCount <= maxRetries) {
            try {
              if (emailConfig.templateId && emailConfig.templateId.trim()) {
                // Use custom template if provided
                console.log(`📤 [Attempt ${retryCount + 1}] Sending to ${contact.email} with template: ${emailConfig.templateId}`)
                response = await Promise.race([
                  emailjs.send(
                    emailConfig.serviceId,
                    emailConfig.templateId,
                    templateParams
                  ),
                  new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Email send timeout after 30 seconds')), 30000)
                  )
                ])
              } else {
                // Use a default template approach
                console.log(`📤 [Attempt ${retryCount + 1}] Sending to ${contact.email} with default approach`)
                response = await Promise.race([
                  emailjs.send(
                    emailConfig.serviceId,
                    'template_default',
                    templateParams
                  ),
                  new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Email send timeout after 30 seconds')), 30000)
                  )
                ])
              }

              // If we get here, the send was successful
              break
            } catch (sendError: any) {
              retryCount++
              console.warn(`⚠️ [Attempt ${retryCount}] Failed to send to ${contact.email}:`, sendError.message)

              if (retryCount <= maxRetries) {
                console.log(`🔄 Retrying in 2 seconds... (${retryCount}/${maxRetries})`)
                await new Promise(resolve => setTimeout(resolve, 2000))
              } else {
                throw sendError
              }
            }
          }

          console.log(`📬 EmailJS response for ${contact.email}:`, response)

          // Validate response more thoroughly
          if (response && (response.status === 200 || response.text === 'OK' || response.status === 'OK')) {
            successCount++
            recipients.push({
              email: contact.email,
              name: contact.name,
              status: 'success'
            })
            console.log(`✅ Email sent successfully to: ${contact.email}`)
          } else {
            failedEmails.push(contact.email)
            recipients.push({
              email: contact.email,
              name: contact.name,
              status: 'failed'
            })
            console.error(`❌ Invalid response for ${contact.email}:`, response)
          }
        } catch (emailError: any) {
          failedEmails.push(contact.email)
          recipients.push({
            email: contact.email,
            name: contact.name,
            status: 'failed'
          })
          console.error(`❌ Error sending email to: ${contact.email}`, {
            error: emailError,
            message: emailError?.message || 'Unknown error',
            stack: emailError?.stack || 'No stack trace',
            response: emailError?.response || 'No response',
            name: emailError?.name || 'Unknown error type'
          })
        }

        // Update progress
        setSendProgress(Math.round(((i + 1) / selectedContacts.length) * 100))

        // Longer delay to avoid rate limiting and ensure delivery
        await new Promise(resolve => setTimeout(resolve, 1500))
      }

      // Save to history
      saveEmailHistory(recipients, selectedTemplate, customSubject, successCount, failedEmails.length)

      // Show detailed results
      const successfulEmails = recipients.filter(r => r.status === 'success').map(r => r.email)
      const failedEmailsList = recipients.filter(r => r.status === 'failed').map(r => r.email)

      if (successCount === selectedContacts.length) {
        setSendStatus('success')
        alert(`🎉 Đã gửi email thành công đến tất cả ${successCount} người nhận!\n\n✅ Thành công: ${successfulEmails.join(', ')}\n\n📋 Lịch sử đã được lưu. Bạn có thể xem lại trong tab "Lịch sử".`)
      } else if (successCount > 0) {
        setSendStatus('success')
        alert(`⚠️ Đã gửi thành công ${successCount}/${selectedContacts.length} email.\n\n✅ Thành công: ${successfulEmails.join(', ')}\n\n❌ Thất bại: ${failedEmailsList.join(', ')}\n\n📋 Lịch sử đã được lưu. Bạn có thể xem lại trong tab "Lịch sử".`)
      } else {
        setSendStatus('error')
        alert(`❌ Không thể gửi email nào.\n\n❌ Tất cả thất bại: ${failedEmailsList.join(', ')}\n\nVui lòng kiểm tra:\n- Cấu hình EmailJS\n- Kết nối internet\n- Địa chỉ email hợp lệ\n\nVà thử lại.`)
      }

      // Clear contacts if user selected this option and sending was successful
      if (clearContactsAfterSend && successCount > 0) {
        setContacts([])
        console.log('📧 Contacts cleared after successful send')
      }

      // Switch to history tab after successful send
      if (successCount > 0) {
        setTimeout(() => {
          setActiveTab('history')
        }, 2000)
      }

    } catch (error) {
      console.error('Error in email sending process:', error)
      setSendStatus('error')
      alert('❌ Có lỗi xảy ra trong quá trình gửi email. Vui lòng thử lại!')
    } finally {
      setIsSending(false)
    }
  }

  // Start editing contact
  const startEditContact = (contact: EmailContact) => {
    setEditingContact(contact.id)
    setEditEmail(contact.email)
    setEditName(contact.name || '')
  }

  // Save edited contact
  const saveEditContact = () => {
    if (!editingContact) return

    const validation = validateEmail(editEmail)
    if (!validation.isValid) {
      alert(`Email không hợp lệ: ${validation.error}`)
      return
    }

    // Check if email already exists (excluding current contact)
    if (contacts.some(c => c.email.toLowerCase() === editEmail.toLowerCase() && c.id !== editingContact)) {
      alert('Email đã tồn tại!')
      return
    }

    setContacts(contacts.map(contact =>
      contact.id === editingContact
        ? {
            ...contact,
            email: editEmail.toLowerCase(),
            name: editName.trim() || undefined,
            isValid: true,
            validationError: undefined
          }
        : contact
    ))

    cancelEditContact()
  }

  // Cancel editing contact
  const cancelEditContact = () => {
    setEditingContact(null)
    setEditEmail('')
    setEditName('')
  }

  // Test single email
  const testSingleEmail = async (contact: EmailContact) => {
    if (!emailConfig.serviceId || !emailConfig.publicKey || emailConfig.publicKey === 'YOUR_EMAILJS_PUBLIC_KEY') {
      alert('⚠️ Vui lòng cấu hình EmailJS trước khi test!')
      setShowEmailConfig(true)
      return
    }

    if (!selectedTemplate && !customContent) {
      alert('⚠️ Vui lòng chọn mẫu email hoặc nhập nội dung tùy chỉnh trước khi test!')
      return
    }

    try {
      console.log(`\n🧪 Testing single email to: ${contact.email}`)

      // Prepare email content
      const emailSubject = (customSubject || selectedTemplate?.subject || '')
        .replace('{homeTeam}', match.homeTeam)
        .replace('{awayTeam}', match.awayTeam)
        .replace('{date}', match.date)
        .replace('{time}', match.time)
        .replace('{venue}', match.venue)

      const emailContent = customContent || selectedTemplate?.content || ''
      const completeHtmlContent = emailContent
        .replace(/{homeTeam}/g, match.homeTeam)
        .replace(/{awayTeam}/g, match.awayTeam)
        .replace(/{date}/g, match.date)
        .replace(/{time}/g, match.time)
        .replace(/{venue}/g, match.venue)

      // Initialize EmailJS
      emailjs.init({
        publicKey: emailConfig.publicKey,
        blockHeadless: true,
        limitRate: {
          id: 'app',
          throttle: 1000,
        },
      })

      // Prepare template parameters
      const templateParams = {
        to_email: contact.email,
        to_name: contact.name || 'Fan bóng đá',
        from_name: 'FCHCMUST - Test Email',
        reply_to: 'noreply@fchcmust.com',
        subject: `🧪 TEST: ${emailSubject}`,
        html_content: completeHtmlContent,
        timestamp: Date.now(),
        recipient_id: contact.id
      }

      console.log(`🧪 Test params:`, templateParams)

      // Send test email
      let response
      if (emailConfig.templateId && emailConfig.templateId.trim()) {
        console.log(`🧪 Using template: ${emailConfig.templateId}`)
        response = await emailjs.send(
          emailConfig.serviceId,
          emailConfig.templateId,
          templateParams
        )
      } else {
        console.log(`🧪 Using direct send (no template)`)
        // Try direct send without template
        response = await emailjs.send(
          emailConfig.serviceId,
          emailConfig.templateId || 'template_simple',
          templateParams
        )
      }

      console.log(`🧪 Test response:`, response)

      if (response && (response.status === 200 || response.text === 'OK' || response.status === 'OK')) {
        alert(`✅ Test email gửi thành công đến ${contact.email}!\n\nVui lòng kiểm tra hộp thư (bao gồm spam folder) để xác nhận.`)
      } else {
        alert(`❌ Test email thất bại đến ${contact.email}.\n\nResponse: ${JSON.stringify(response)}`)
      }
    } catch (error: any) {
      console.error(`🧪 Test email error:`, error)
      alert(`❌ Lỗi khi test email đến ${contact.email}:\n\n${error.message || 'Unknown error'}`)
    }
  }

  // Test without template (bypass template issues)
  const testWithoutTemplate = async () => {
    if (!emailConfig.serviceId || !emailConfig.publicKey || emailConfig.publicKey === 'YOUR_EMAILJS_PUBLIC_KEY') {
      alert('⚠️ Vui lòng cấu hình EmailJS trước khi test!')
      setShowEmailConfig(true)
      return
    }

    const selectedContacts = contacts.filter(c => c.selected && c.isValid !== false)
    if (selectedContacts.length === 0) {
      alert('⚠️ Vui lòng thêm và chọn ít nhất một email để test!')
      return
    }

    try {
      console.log(`\n🔧 Testing multiple template approaches to bypass template issues...`)

      // Initialize EmailJS
      emailjs.init({
        publicKey: emailConfig.publicKey,
        blockHeadless: true,
        limitRate: {
          id: 'app',
          throttle: 1000,
        },
      })

      const testContact = selectedContacts[0]
      console.log(`🔧 Testing to: ${testContact.email}`)

      // Try multiple template approaches
      const templateOptions = [
        'template_simple',
        'template_default',
        emailConfig.templateId, // Current template but with different params
        'template_test'
      ]

      let success = false
      let lastError = null

      for (const templateId of templateOptions) {
        if (!templateId) continue

        try {
          console.log(`🔧 Trying template: ${templateId}`)

          // Use different parameter sets for different templates
          let templateParams

          if (templateId === emailConfig.templateId) {
            // Use original params but with clear debug info
            templateParams = {
              to_email: testContact.email,
              to_name: testContact.name || 'Debug Test User',
              from_name: 'FCHCMUST - Template Debug',
              reply_to: 'noreply@fchcmust.com',
              subject: `🔧 TEMPLATE DEBUG: Gửi đến ${testContact.email}`,
              html_content: `<h2>🔧 Template Debug Test</h2><p>Email này được gửi để debug template <strong>${templateId}</strong></p><p><strong>Địa chỉ nhận:</strong> ${testContact.email}</p><p><strong>Trận đấu:</strong> ${match.homeTeam} vs ${match.awayTeam}</p><p><strong>Thời gian:</strong> ${match.date} - ${match.time}</p><p><strong>Địa điểm:</strong> ${match.venue}</p>`,
              timestamp: Date.now(),
              recipient_id: testContact.id
            }
          } else {
            // Use simple params for other templates
            templateParams = {
              to_email: testContact.email,
              to_name: testContact.name || 'Test User',
              from_name: 'FCHCMUST - Simple Test',
              reply_to: 'noreply@fchcmust.com',
              subject: `🔧 SIMPLE TEST: ${templateId}`,
              message: `Debug test với template: ${templateId}\nGửi đến: ${testContact.email}\nTrận đấu: ${match.homeTeam} vs ${match.awayTeam}`,
              timestamp: Date.now()
            }
          }

          console.log(`🔧 Params for ${templateId}:`, templateParams)

          const response = await Promise.race([
            emailjs.send(emailConfig.serviceId, templateId, templateParams),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout after 15 seconds')), 15000)
            )
          ])

          console.log(`🔧 Response from ${templateId}:`, response)

          if (response && (response.status === 200 || response.text === 'OK' || response.status === 'OK')) {
            alert(`✅ Debug test thành công với template: ${templateId}!\n\nEmail đã được gửi đến: ${testContact.email}\n\nVui lòng kiểm tra hộp thư để xác nhận email có đến đúng địa chỉ không.\n\nNếu email đến đúng địa chỉ, template này hoạt động tốt!`)
            success = true
            break
          }
        } catch (templateError: any) {
          console.warn(`🔧 Template ${templateId} failed:`, templateError.message || templateError)
          lastError = templateError
          continue
        }
      }

      if (!success) {
        throw lastError || new Error('Tất cả template đều thất bại')
      }

    } catch (error: any) {
      console.error(`🔧 Debug test error:`, error)
      const errorMessage = error?.message || error?.text || 'Unknown error'
      alert(`❌ Lỗi debug test:\n\n${errorMessage}\n\n💡 Giải pháp:\n1. Tạo template 'template_simple' trên EmailJS dashboard\n2. Hoặc kiểm tra template hiện tại có cấu hình đúng không\n3. Đảm bảo To Email = {{to_email}} (không phải email cố định)`)
    }
  }

  // Debug localStorage
  const debugLocalStorage = () => {
    try {
      console.log('\n🔍 DEBUG LOCALSTORAGE:')

      // Check contacts
      const savedContacts = localStorage.getItem('fchcmust-email-contacts')
      console.log('📧 Contacts in localStorage:', savedContacts ? JSON.parse(savedContacts).length : 0)

      // Check email config
      const savedEmailConfig = localStorage.getItem('fchcmust-email-config')
      console.log('⚙️ Email config in localStorage:', savedEmailConfig ? 'Yes' : 'No')

      // Check email history (all matches)
      const savedEmailHistory = localStorage.getItem('fchcmust-email-history')
      const allHistory = savedEmailHistory ? JSON.parse(savedEmailHistory) : []
      console.log('📜 Total email history in localStorage:', allHistory.length)

      // Filter history for current match
      const currentMatchHistory = allHistory.filter((entry: any) => entry.matchId === match.id)
      console.log(`📜 Email history for current match (${match.id}):`, currentMatchHistory.length)

      if (allHistory.length > 0) {
        console.log('📜 All history entries by match:')
        const historyByMatch = allHistory.reduce((acc: any, entry: any) => {
          const matchKey = entry.matchId || 'unknown'
          if (!acc[matchKey]) acc[matchKey] = []
          acc[matchKey].push(entry)
          return acc
        }, {})

        Object.keys(historyByMatch).forEach(matchId => {
          const entries = historyByMatch[matchId]
          console.log(`  Match ${matchId}: ${entries.length} entries`)
          if (entries.length > 0) {
            const latest = entries[0]
            console.log(`    Latest: ${latest.match.homeTeam} vs ${latest.match.awayTeam} - ${latest.timestamp}`)
          }
        })
      }

      if (currentMatchHistory.length > 0) {
        console.log(`📜 Current match history details:`)
        currentMatchHistory.slice(0, 3).forEach((entry: any, index: number) => {
          console.log(`  ${index + 1}. ${entry.match.homeTeam} vs ${entry.match.awayTeam} - ${entry.timestamp}`)
          console.log(`     Recipients: ${entry.recipients.length}, Sent: ${entry.totalSent}, Failed: ${entry.totalFailed}`)
        })
      }

      // Check current state
      console.log('\n🔍 CURRENT STATE:')
      console.log('📧 Current contacts:', contacts.length)
      console.log('📜 Current email history in state:', emailHistory.length)
      console.log('🎯 Current match ID:', match.id)
      console.log('🎯 Current match:', `${match.homeTeam} vs ${match.awayTeam}`)

      if (emailHistory.length > 0) {
        console.log('📜 Latest history in state:')
        emailHistory.slice(0, 3).forEach((entry, index) => {
          console.log(`  ${index + 1}. ${entry.match.homeTeam} vs ${entry.match.awayTeam} - ${entry.timestamp}`)
          console.log(`     Recipients: ${entry.recipients.length}, Sent: ${entry.totalSent}, Failed: ${entry.totalFailed}`)
        })
      }

      // Show summary
      const currentHistoryCount = emailHistory.length

      alert(`🔍 Debug LocalStorage:\n\n📧 Contacts: ${savedContacts ? JSON.parse(savedContacts).length : 0}\n📜 Total History: ${allHistory.length}\n📜 Current Match History: ${currentMatchHistory.length}\n📜 History in State: ${currentHistoryCount}\n\n🎯 Current Match: ${match.homeTeam} vs ${match.awayTeam}\n🎯 Match ID: ${match.id}\n\n${currentMatchHistory.length === 0 ? '❌ Không có lịch sử cho trận đấu này!' : '✅ Có lịch sử cho trận đấu này'}\n\nKiểm tra Console để xem chi tiết!`)

    } catch (error) {
      console.error('❌ Error debugging localStorage:', error)
      alert(`❌ Lỗi khi debug localStorage:\n\n${error}`)
    }
  }

  // Clear email history
  const clearEmailHistory = () => {
    if (confirm('🗑️ Bạn có chắc muốn xóa toàn bộ lịch sử email?\n\nHành động này không thể hoàn tác!')) {
      setEmailHistory([])
      localStorage.removeItem('fchcmust-email-history')
      console.log('🗑️ Email history cleared')
      alert('✅ Đã xóa toàn bộ lịch sử email!')
    }
  }

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      contact.email.toLowerCase().includes(searchLower) ||
      (contact.name && contact.name.toLowerCase().includes(searchLower))
    )
  })

  // Filter email history based on search term
  const filteredHistory = emailHistory.filter(history => {
    if (!historySearchTerm) return true
    const searchLower = historySearchTerm.toLowerCase()
    return (
      history.match.homeTeam.toLowerCase().includes(searchLower) ||
      history.match.awayTeam.toLowerCase().includes(searchLower) ||
      history.match.venue.toLowerCase().includes(searchLower) ||
      history.template.name.toLowerCase().includes(searchLower) ||
      history.recipients.some(recipient =>
        recipient.email.toLowerCase().includes(searchLower) ||
        (recipient.name && recipient.name.toLowerCase().includes(searchLower))
      )
    )
  })

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Mail className="h-6 w-6 text-blue-600" />
            Gửi thông báo trận đấu
            <Badge variant="outline" className="ml-2">
              {match.homeTeam} vs {match.awayTeam}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmailConfig(true)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Cấu hình Email
            </Button>
            {emailConfig.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY' && (
              <>
                <Badge variant="secondary" className="text-green-600">
                  ✅ Đã cấu hình
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testEmailConfig}
                  className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  🧪 Test Email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testWithoutTemplate}
                  className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  🔧 Test No Template
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://dashboard.emailjs.com/admin/templates', '_blank')}
                  className="flex items-center gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  🌐 EmailJS Dashboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={debugLocalStorage}
                  className="flex items-center gap-2 text-gray-600 border-gray-200 hover:bg-gray-50"
                >
                  🔍 Debug Storage
                </Button>
              </>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Danh sách email
            </TabsTrigger>
            <TabsTrigger value="template" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Chọn mẫu
            </TabsTrigger>
            <TabsTrigger value="customize" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Tùy chỉnh
            </TabsTrigger>
            <TabsTrigger value="send" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Gửi email
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Lịch sử
              {emailHistory.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {emailHistory.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Quản lý danh sách email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add email manually */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Email address"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                  />
                  <Input
                    placeholder="Tên (tùy chọn)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                  />
                  <Button onClick={addEmail} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Thêm email
                  </Button>
                </div>

                {/* Upload Excel file */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Hoặc tải lên file Excel với danh sách email
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingExcel}
                  >
                    {isUploadingExcel ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Chọn file Excel
                      </>
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleExcelUpload}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Hỗ trợ: .xlsx, .xls, .csv (Cột A: Email, Cột B: Tên)
                  </p>
                </div>

                {/* Search box */}
                {contacts.length > 0 && (
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm kiếm email hoặc tên..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                )}

                {/* Email list */}
                {contacts.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">
                          Danh sách email ({filteredContacts.filter(c => c.selected).length}/{filteredContacts.length} hiển thị)
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>✅ Hợp lệ: {filteredContacts.filter(c => c.isValid !== false).length}</span>
                          {filteredContacts.filter(c => c.isValid === false).length > 0 && (
                            <span className="text-red-600">❌ Không hợp lệ: {filteredContacts.filter(c => c.isValid === false).length}</span>
                          )}
                          {searchTerm && (
                            <span className="text-blue-600">🔍 Đang lọc: "{searchTerm}"</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={selectAllEmails}>
                          Chọn tất cả
                        </Button>
                        <Button size="sm" variant="outline" onClick={deselectAllEmails}>
                          Bỏ chọn tất cả
                        </Button>
                        {contacts.filter(c => c.selected).length > 0 && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={deleteSelectedEmails}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            Xóa đã chọn
                          </Button>
                        )}
                        {contacts.filter(c => c.isValid === false).length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={deleteInvalidEmails}
                            className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                            Xóa không hợp lệ
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {filteredContacts.map((contact) => (
                        <div
                          key={contact.id}
                          className={cn(
                            "border rounded-lg",
                            contact.isValid === false
                              ? "bg-red-50 border-red-200"
                              : contact.selected
                                ? "bg-blue-50 border-blue-200"
                                : "bg-gray-50"
                          )}
                        >
                          {editingContact === contact.id ? (
                            // Edit mode
                            <div className="p-3 space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <Input
                                  value={editEmail}
                                  onChange={(e) => setEditEmail(e.target.value)}
                                  placeholder="Email address"
                                  className="text-sm"
                                />
                                <Input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  placeholder="Tên (tùy chọn)"
                                  className="text-sm"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={saveEditContact}
                                  className="flex items-center gap-1"
                                >
                                  <Check className="h-3 w-3" />
                                  Lưu
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEditContact}
                                  className="flex items-center gap-1"
                                >
                                  <X className="h-3 w-3" />
                                  Hủy
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // View mode
                            <div className="flex items-center justify-between p-3">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={contact.selected}
                                  onChange={() => toggleEmailSelection(contact.id)}
                                  className="rounded"
                                />
                                <div>
                                  <div className={cn(
                                    "font-medium",
                                    contact.isValid === false ? "text-red-600" : ""
                                  )}>
                                    {contact.email}
                                    {contact.isValid === false && (
                                      <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                        ❌ Không hợp lệ
                                      </span>
                                    )}
                                  </div>
                                  {contact.name && (
                                    <div className="text-sm text-gray-500">{contact.name}</div>
                                  )}
                                  {contact.validationError && (
                                    <div className="text-xs text-red-500 mt-1">
                                      🔸 {contact.validationError}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => testSingleEmail(contact)}
                                  className="text-green-500 hover:text-green-700"
                                  title="Test gửi email đơn lẻ"
                                  disabled={!emailConfig.serviceId || !emailConfig.publicKey || emailConfig.publicKey === 'YOUR_EMAILJS_PUBLIC_KEY'}
                                >
                                  🧪
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEditContact(contact)}
                                  className="text-blue-500 hover:text-blue-700"
                                  title="Chỉnh sửa"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeEmail(contact.id)}
                                  className="text-red-500 hover:text-red-700"
                                  title="Xóa"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Template Selection Tab */}
          <TabsContent value="template" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Chọn mẫu email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {emailTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={cn(
                        "border rounded-lg p-4 cursor-pointer transition-all",
                        selectedTemplate?.id === template.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{template.name}</h3>
                        {selectedTemplate?.id === template.id && (
                          <Check className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {template.subject.replace(/{[^}]+}/g, '...')}
                      </p>
                      <Badge variant={template.type === 'modern' ? 'default' : 'secondary'}>
                        {template.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customize Tab */}
          <TabsContent value="customize" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Tùy chỉnh nội dung email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tiêu đề email</label>
                  <Input
                    value={customSubject || selectedTemplate?.subject || ''}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Nhập tiêu đề email..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Nội dung email</label>
                  <Textarea
                    value={customContent || selectedTemplate?.content || ''}
                    onChange={(e) => setCustomContent(e.target.value)}
                    placeholder="Nhập nội dung email..."
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Biến có thể sử dụng:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <code>{'{homeTeam}'}</code>
                    <code>{'{awayTeam}'}</code>
                    <code>{'{date}'}</code>
                    <code>{'{time}'}</code>
                    <code>{'{venue}'}</code>
                  </div>
                </div>

                <Button
                  onClick={() => setIsPreviewOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Xem trước
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Send Tab */}
          <TabsContent value="send" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Gửi email hàng loạt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Tóm tắt gửi email:</h4>
                  <div className="space-y-1 text-sm">
                    <p>📧 Số email được chọn: <strong>{contacts.filter(c => c.selected).length}</strong></p>
                    <p>📝 Mẫu email: <strong>{selectedTemplate?.name || 'Tùy chỉnh'}</strong></p>
                    <p>⚽ Trận đấu: <strong>{match.homeTeam} vs {match.awayTeam}</strong></p>
                    <p>📅 Ngày: <strong>{match.date} - {match.time}</strong></p>
                  </div>
                </div>

                <Button
                  onClick={() => setIsPreviewOpen(true)}
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Xem trước email cuối cùng
                </Button>

                {sendStatus === 'sending' && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Đang gửi email...</span>
                      <span className="text-sm text-gray-600">{sendProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${sendProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {sendStatus === 'success' && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <Check className="h-5 w-5" />
                      <span className="font-medium">Gửi email thành công!</span>
                    </div>
                  </div>
                )}

                {sendStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <X className="h-5 w-5" />
                      <span className="font-medium">Có lỗi xảy ra khi gửi email!</span>
                    </div>
                  </div>
                )}

                {/* Clear contacts option */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="clearContactsAfterSend"
                      checked={clearContactsAfterSend}
                      onChange={(e) => setClearContactsAfterSend(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="clearContactsAfterSend" className="text-sm text-gray-700 cursor-pointer">
                      🗑️ Xóa danh sách email sau khi gửi thành công
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    Nếu bỏ chọn, danh sách email sẽ được giữ lại để sử dụng cho lần gửi tiếp theo
                  </p>
                </div>

                <Button
                  onClick={sendEmails}
                  disabled={
                    contacts.filter(c => c.selected).length === 0 ||
                    (!selectedTemplate && !customContent) ||
                    isSending
                  }
                  className="w-full flex items-center gap-2"
                  size="lg"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Gửi email ({contacts.filter(c => c.selected).length} người nhận)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Lịch sử gửi email
                  {emailHistory.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {emailHistory.length} lần gửi
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {emailHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch sử gửi email</h3>
                    <p className="text-gray-600">
                      Sau khi gửi email thành công, lịch sử sẽ được hiển thị ở đây.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Search box for history */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Tìm kiếm trong lịch sử (đội bóng, địa điểm, email...)..."
                        value={historySearchTerm}
                        onChange={(e) => setHistorySearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* History list */}
                    <div className="space-y-4">
                      {filteredHistory.map((history) => (
                        <div key={history.id} className="border rounded-lg p-4 bg-white">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-lg">
                                {history.match.homeTeam} vs {history.match.awayTeam}
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {history.match.date}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {history.match.time}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {history.match.venue}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">
                                {new Date(history.timestamp).toLocaleString('vi-VN')}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-green-600">
                                  ✅ {history.totalSent} thành công
                                </Badge>
                                {history.totalFailed > 0 && (
                                  <Badge variant="secondary" className="text-red-600">
                                    ❌ {history.totalFailed} thất bại
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <div className="text-sm">
                              <span className="font-medium">Template:</span> {history.template.name}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Tiêu đề:</span> {history.template.subject}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                Danh sách người nhận ({history.recipients.length})
                              </span>
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {history.recipients.map((recipient, index) => (
                                <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                                  <div>
                                    <span className="font-medium">{recipient.email}</span>
                                    {recipient.name && (
                                      <span className="text-gray-600 ml-2">({recipient.name})</span>
                                    )}
                                  </div>
                                  <Badge
                                    variant={recipient.status === 'success' ? 'secondary' : 'destructive'}
                                    className={recipient.status === 'success' ? 'text-green-600' : 'text-red-600'}
                                  >
                                    {recipient.status === 'success' ? '✅ Thành công' : '❌ Thất bại'}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {filteredHistory.length === 0 && historySearchTerm && (
                      <div className="text-center py-8">
                        <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">
                          Không tìm thấy kết quả cho "{historySearchTerm}"
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Email Preview Modal */}
        {isPreviewOpen && (
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Xem trước email</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tiêu đề:</label>
                  <div className="p-2 bg-gray-50 rounded border">
                    {(customSubject || selectedTemplate?.subject || '')
                      .replace('{homeTeam}', match.homeTeam)
                      .replace('{awayTeam}', match.awayTeam)
                      .replace('{date}', match.date)
                      .replace('{time}', match.time)
                      .replace('{venue}', match.venue)
                    }
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nội dung:</label>
                  <div
                    className="border rounded p-4 bg-white"
                    dangerouslySetInnerHTML={{
                      __html: (customContent || selectedTemplate?.content || '')
                        .replace(/{homeTeam}/g, match.homeTeam)
                        .replace(/{awayTeam}/g, match.awayTeam)
                        .replace(/{date}/g, match.date)
                        .replace(/{time}/g, match.time)
                        .replace(/{venue}/g, match.venue)
                    }}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* EmailJS Configuration Modal */}
        {showEmailConfig && (
          <Dialog open={showEmailConfig} onOpenChange={setShowEmailConfig}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Cấu hình EmailJS
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="bg-green-50 p-3 rounded-lg mb-4">
                  <h4 className="font-medium text-green-800 mb-2">💾 Lưu trữ tự động</h4>
                  <p className="text-sm text-green-700">
                    ✅ Tất cả dữ liệu được lưu tự động vào trình duyệt. Danh sách email, cấu hình và lịch sử sẽ được giữ lại khi bạn quay lại!
                  </p>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">📧 Hướng dẫn nhanh</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p><strong>1.</strong> Tạo tài khoản tại <a href="https://emailjs.com" target="_blank" className="underline">emailjs.com</a></p>
                    <p><strong>2.</strong> Tạo Email Service → Lưu Service ID</p>
                    <p><strong>3.</strong> Tạo Template với Subject: <code className="bg-blue-100 px-1 rounded">{'{{subject}}'}</code> và Content: <code className="bg-blue-100 px-1 rounded">{'{{{html_content}}}'}</code></p>
                    <p><strong>4.</strong> Lấy Public Key từ Account → API Keys</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="serviceId">Service ID</Label>
                    <Input
                      id="serviceId"
                      value={emailConfig.serviceId}
                      onChange={(e) => setEmailConfig({...emailConfig, serviceId: e.target.value})}
                      placeholder="service_xxxxxxx"
                    />
                  </div>

                  <div>
                    <Label htmlFor="templateId">Template ID</Label>
                    <Input
                      id="templateId"
                      value={emailConfig.templateId}
                      onChange={(e) => setEmailConfig({...emailConfig, templateId: e.target.value})}
                      placeholder="template_simple"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Sử dụng template đơn giản: template_simple
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="publicKey">Public Key</Label>
                    <Input
                      id="publicKey"
                      value={emailConfig.publicKey}
                      onChange={(e) => setEmailConfig({...emailConfig, publicKey: e.target.value})}
                      placeholder="user_xxxxxxxxxxxxxxxx"
                    />
                  </div>
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">⚠️ Template Setup</h4>
                  <div className="bg-yellow-100 p-2 rounded text-xs font-mono mb-2">
                    <div><strong>Subject:</strong> {'{{subject}}'}</div>
                    <div><strong>Content:</strong> {'{{{html_content}}}'}</div>
                  </div>
                  <div className="text-xs text-yellow-700 space-y-1">
                    <p>🚫 <strong>KHÔNG</strong> dán HTML vào EmailJS dashboard</p>
                    <p>✅ <strong>CHỈ</strong> sử dụng 2 biến trên</p>
                    <p>🔄 Hệ thống tự động thay thế thông tin trận đấu</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowEmailConfig(false)}>
                    Hủy
                  </Button>
                  <Button
                    onClick={() => {
                      setShowEmailConfig(false)
                      alert('✅ Đã lưu cấu hình EmailJS!\n\n💡 Tip: Click nút "🧪 Test Email" để kiểm tra cấu hình trước khi gửi email thật.')
                    }}
                    disabled={!emailConfig.serviceId || !emailConfig.publicKey}
                  >
                    Lưu cấu hình
                  </Button>
                  {emailConfig.serviceId && emailConfig.publicKey && emailConfig.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY' && (
                    <Button
                      onClick={testEmailConfig}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      🧪 Test ngay
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}
