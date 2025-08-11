"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, Trash2, Plus, X, Link, Mail, Database, Upload, FileText, Copy as CopyIcon, Edit, Loader2, XCircle } from "lucide-react"
import { useAuth } from "./app/contexts/AuthContext"

interface TableData {
  id: string // Add unique ID
  name: string
  originalStructureName: string // Store the original structure name for header protection
  rawData: string // Always stored in horizontal format
  textareaData: string // What's shown in textarea (changes based on view mode)
  parsedData: string[][]
  displayData: string[][] // Add this new property
  viewMode: 'horizontal' | 'vertical'
}

interface EmailData {
  id: string
  email: string
}

// Interface for the predefined table structures
interface PredefinedTableStructure {
  table_id: number
  name: string
  columns: string[]
  sampleData?: Record<string, any>[]
}

export default function Component() {
  const { user, isLoading } = useAuth()

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to access the form</p>
          <Button onClick={() => window.location.href = '/login'} className="bg-blue-600 hover:bg-blue-700">
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  const [formData, setFormData] = useState({
    contractName: "",
    contractDocument: null as File | null,
  })

  const [emails, setEmails] = useState<EmailData[]>([{ id: crypto.randomUUID(), email: "" }])

  // Start with no tables
  const [tables, setTables] = useState<TableData[]>([])

  // Mapping of table IDs to email IDs (instead of table names)
  const [tableEmailMapping, setTableEmailMapping] = useState<Record<string, string[]>>({})
  // Mapping of table IDs to CC email IDs (instead of table names)
  const [tableCCEmailMapping, setTableCCEmailMapping] = useState<Record<string, string[]>>({})

  // State for table creation modal
  const [showTableCreationModal, setShowTableCreationModal] = useState(false)
  const [newTableName, setNewTableName] = useState("")
  const [selectedTableStructure, setSelectedTableStructure] = useState<string>("")
  const [selectedEmailsForNewTable, setSelectedEmailsForNewTable] = useState<string[]>([])
  const [selectedCCEmailsForNewTable, setSelectedCCEmailsForNewTable] = useState<string[]>([])

  // State for edit emails modal
  const [showEditEmailsModal, setShowEditEmailsModal] = useState(false)
  const [editingTableName, setEditingTableName] = useState<string>("")
  const [selectedEmailsForEdit, setSelectedEmailsForEdit] = useState<string[]>([])
  const [selectedCCEmailsForEdit, setSelectedCCEmailsForEdit] = useState<string[]>([])

  // State for loading predefined table structures
  const [predefinedTableStructures, setPredefinedTableStructures] = useState<PredefinedTableStructure[]>([])
  const [isLoadingStructures, setIsLoadingStructures] = useState(true)
  const [structureLoadError, setStructureLoadError] = useState<string | null>(null)

  // Load predefined table structures on component mount
  useEffect(() => {
    const fetchTableStructures = async () => {
      try {
        setIsLoadingStructures(true)
        setStructureLoadError(null)
        
        const response = await fetch('https://gep1.app.n8n.cloud/webhook/FIN-table-schema')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch table structures: ${response.status}`)
        }
        
        const data = await response.json()
        
        // Transform the data to match our interface
        const transformedStructures: PredefinedTableStructure[] = data.map((item: any) => ({
          table_id: item.table_id,
          name: item.name,
          columns: item.columns // Use only the actual columns from API
        }))
        
        setPredefinedTableStructures(transformedStructures)
      } catch (error) {
        console.error('Error fetching table structures:', error)
        setStructureLoadError(error instanceof Error ? error.message : 'Failed to load table structures')
        
        // Fallback to default structures if API fails
        const fallbackStructures: PredefinedTableStructure[] = [
          {
            table_id: 1,
            name: "Employee Data",
            columns: ["id", "name", "email", "department", "salary"]
          },
          {
            table_id: 2,
            name: "Product Inventory",
            columns: ["product_id", "product_name", "category", "price", "stock"]
          },
          {
            table_id: 3,
            name: "Customer Orders",
            columns: ["order_id", "customer_name", "product", "quantity", "total", "order_date"]
          },
          {
            table_id: 4,
            name: "Sales Data",
            columns: ["sale_id", "salesperson", "region", "amount", "date"]
          },
          {
            table_id: 5,
            name: "Project Tasks",
            columns: ["task_id", "task_name", "assignee", "priority", "status", "due_date"]
          }
        ]
        setPredefinedTableStructures(fallbackStructures)
      } finally {
        setIsLoadingStructures(false)
      }
    }

    fetchTableStructures()
  }, [])

  const addEmail = () => {
    const newEmail: EmailData = {
      id: crypto.randomUUID(),
      email: "",
    }
    setEmails([...emails, newEmail])
  }

  const removeEmail = (emailId: string) => {
    if (emails.length > 1) {
      setEmails(emails.filter((e) => e.id !== emailId))
      // Remove this email from all table mappings
      const updatedMapping = { ...tableEmailMapping }
      Object.keys(updatedMapping).forEach((tableId) => {
        updatedMapping[tableId] = updatedMapping[tableId]?.filter((id) => id !== emailId) || []
      })
      setTableEmailMapping(updatedMapping)
      
      // Remove from CC mappings too
      const updatedCCMapping = { ...tableCCEmailMapping }
      Object.keys(updatedCCMapping).forEach((tableId) => {
        updatedCCMapping[tableId] = updatedCCMapping[tableId]?.filter((id) => id !== emailId) || []
      })
      setTableCCEmailMapping(updatedCCMapping)
    }
  }

  const updateEmail = (emailId: string, email: string) => {
    // Check for duplicate emails
    const isDuplicate = emails.some(e => e.id !== emailId && e.email.toLowerCase().trim() === email.toLowerCase().trim())
    
    if (isDuplicate && email.trim() !== "") {
      alert("This email address is already added. Duplicate emails are not allowed.")
      return
    }
    
    setEmails(emails.map((e) => (e.id === emailId ? { ...e, email } : e)))
  }

  const addTable = () => {
    // Check if there are any valid emails
    const validEmails = emails.filter(e => e.email.trim() !== "")
    if (validEmails.length === 0) {
      alert("Please add at least one email address before creating a table.")
      return
    }
    setShowTableCreationModal(true)
    setNewTableName("")
    setSelectedEmailsForNewTable([])
  }

  const handleTableStructureSelection = (structureName: string) => {
    setSelectedTableStructure(structureName)
    const selectedStructure = predefinedTableStructures.find(s => s.name === structureName)
    if (selectedStructure) {
      setNewTableName(selectedStructure.table_id.toString()) // Convert number to string for input
    }
  }

  // Get available table structures (allow multiple tables with same structure)
  const getAvailableTableStructures = () => {
    return predefinedTableStructures
  }

  const toggleEmailSelectionForNewTable = (emailId: string) => {
    console.log('Toggling email selection:', emailId)
    setSelectedEmailsForNewTable(prev => {
      const newSelection = prev.includes(emailId) 
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
      console.log('New email selection:', newSelection)
      return newSelection
    })
  }

  const toggleCCEmailSelectionForNewTable = (emailId: string) => {
    console.log('Toggling CC email selection:', emailId)
    setSelectedCCEmailsForNewTable(prev => {
      const newSelection = prev.includes(emailId) 
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
      console.log('New CC email selection:', newSelection)
      return newSelection
    })
  }

  const openEditEmailsModal = (tableId: string) => {
    setEditingTableName(tableId)
    setSelectedEmailsForEdit(tableEmailMapping[tableId] || [])
    setSelectedCCEmailsForEdit(tableCCEmailMapping[tableId] || [])
    setShowEditEmailsModal(true)
  }

  const toggleEmailSelectionForEdit = (emailId: string) => {
    console.log('Toggling email selection for edit:', emailId)
    setSelectedEmailsForEdit(prev => {
      const newSelection = prev.includes(emailId) 
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
      console.log('New email selection for edit:', newSelection)
      return newSelection
    })
  }

  const toggleCCEmailSelectionForEdit = (emailId: string) => {
    console.log('Toggling CC email selection for edit:', emailId)
    setSelectedCCEmailsForEdit(prev => {
      const newSelection = prev.includes(emailId) 
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
      console.log('New CC email selection for edit:', newSelection)
      return newSelection
    })
  }

  const saveEditedEmails = () => {
    if (selectedEmailsForEdit.length === 0) {
      alert("Please select at least one email address.")
      return
    }

    setTableEmailMapping(prev => ({
      ...prev,
      [editingTableName]: selectedEmailsForEdit
    }))

    setTableCCEmailMapping(prev => ({
      ...prev,
      [editingTableName]: selectedCCEmailsForEdit
    }))

    // Reset modal state
    setShowEditEmailsModal(false)
    setEditingTableName("")
    setSelectedEmailsForEdit([])
    setSelectedCCEmailsForEdit([])
  }

  // Generate unique table name with required format: tableName_<DateToday>_<ID>
  const generateTableName = (baseStructureName: string): string => {
    const today = new Date()
    const day = today.getDate().toString().padStart(2, '0')
    const month = (today.getMonth() + 1).toString().padStart(2, '0')
    const year = today.getFullYear()
    const dateToday = `${day}${month}${year}`
    
    // Generate a unique 4-5 digit ID
    const uniqueId = Math.floor(Math.random() * 90000) + 10000 // 5-digit number
    
    // Replace spaces with underscores in the structure name
    const sanitizedName = baseStructureName.replace(/\s+/g, '')
    
    return `${sanitizedName}_${dateToday}_${uniqueId}`
  }

  const createTableFromStructure = () => {
    if (!selectedTableStructure || selectedEmailsForNewTable.length === 0) {
      alert("Please select a structure and choose at least one email.")
      return
    }

    const selectedStructure = predefinedTableStructures.find(s => s.name === selectedTableStructure)
    if (!selectedStructure) return

    // Convert the structure to tab-separated data
    const headers = selectedStructure.columns.join('\t')
    const rows = selectedStructure.sampleData?.map(row => 
      selectedStructure.columns.map(col => row[col]).join('\t')
    ) || []
    const rawData = [headers, ...rows].join('\n')

    const tableId = crypto.randomUUID() // Generate unique table ID
    const generatedTableName = generateTableName(selectedTableStructure)
    
    const newTable: TableData = {
      id: tableId,
      name: generatedTableName, // Use generated table name with date and ID
      originalStructureName: selectedTableStructure, // Store original structure name for header protection
      rawData: rawData, // Always stored in horizontal format
      textareaData: rawData, // Initially same as rawData for horizontal mode
      parsedData: parseTableData(rawData),
      displayData: parseTableData(rawData), // Initially same as parsedData
      viewMode: 'horizontal', // Default view mode
    }

    setTables([...tables, newTable])
    
    // Set up email mapping for the new table using table ID
    setTableEmailMapping(prev => ({
      ...prev,
      [tableId]: selectedEmailsForNewTable
    }))

    // Set up CC email mapping for the new table using table ID
    setTableCCEmailMapping(prev => ({
      ...prev,
      [tableId]: selectedCCEmailsForNewTable
    }))
    
    // Reset modal state
    setShowTableCreationModal(false)
    setNewTableName("")
    setSelectedTableStructure("")
    setSelectedEmailsForNewTable([])
    setSelectedCCEmailsForNewTable([])
  }

  const removeTable = (tableIndex: number) => {
    const tableToRemove = tables[tableIndex]
    setTables(tables.filter((_, index) => index !== tableIndex))
    // Remove mapping for this table using table ID
    const updatedMapping = { ...tableEmailMapping }
    delete updatedMapping[tableToRemove.id]
    setTableEmailMapping(updatedMapping)
    
    // Remove CC mapping for this table using table ID
    const updatedCCMapping = { ...tableCCEmailMapping }
    delete updatedCCMapping[tableToRemove.id]
    setTableCCEmailMapping(updatedCCMapping)
  }



  const parseTableData = (data: string) => {
    if (!data.trim()) return []
    const lines = data.trim().split("\n")
    return lines.map((line) => line.split("\t").map((cell) => cell.trim()))
  }

  // Helper function to transpose 2D array data
  const transposeData = (data: string[][]): string[][] => {
    if (!data || data.length === 0) return []
    
    const maxLength = Math.max(...data.map(row => row.length))
    const transposed: string[][] = []
    
    for (let col = 0; col < maxLength; col++) {
      const newRow: string[] = []
      for (let row = 0; row < data.length; row++) {
        newRow.push(data[row][col] || '')
      }
      transposed.push(newRow)
    }
    
    return transposed
  }

  // Helper function to convert horizontal data to vertical format (for textarea display)
const convertToVerticalFormat = (rawData: string): string => {
  const parsedData = parseTableData(rawData)
  if (parsedData.length === 0) return rawData
  
  // Convert the entire dataset to vertical format
  // Each column becomes a row in vertical mode
  const transposedData = transposeData(parsedData)
  
  // Convert each row to a single line (tab-separated)
  return transposedData.map(row => row.join('\t')).join('\n')
}

// Helper function to convert vertical format back to horizontal (from textarea)
const convertToHorizontalFormat = (verticalData: string): string => {
  const lines = verticalData.trim().split('\n')
  if (lines.length === 0) return verticalData
  
  // Convert vertical data back to horizontal format
  const transposedBack = transposeData(lines.map(line => line.split('\t')))
  return transposedBack.map(row => row.join('\t')).join('\n')
}

// Helper function to get display data based on view mode
const getDisplayData = (rawData: string, viewMode: 'horizontal' | 'vertical'): string[][] => {
  const parsedData = parseTableData(rawData)
  if (viewMode === 'vertical') {
    return transposeData(parsedData)
  }
  return parsedData
}

// Helper function to get submission data (always horizontal)
const getSubmissionData = (rawData: string, viewMode: 'horizontal' | 'vertical'): string[][] => {
  const parsedData = parseTableData(rawData)
  // rawData is always stored in horizontal format, so just return parsedData
  return parsedData
}

  const handleTableDataChange = (tableIndex: number, value: string) => {
    const table = tables[tableIndex]
    const selectedStructure = predefinedTableStructures.find(s => s.name === table.originalStructureName)
    
    let finalRawData: string
    
    if (table.viewMode === 'vertical') {
      // Convert vertical textarea input back to horizontal format for storage
      finalRawData = convertToHorizontalFormat(value)
    } else {
      // Horizontal mode - store as-is
      finalRawData = value
    }
    
    if (selectedStructure) {
      // Get the original header row from the structure
      const originalHeaders = selectedStructure.columns.join('\t')
      
      // Split the horizontal data to check headers
      const lines = finalRawData.trim().split('\n')
      
      // If there are lines and the first line doesn't match the original headers
      if (lines.length > 0) {
        const firstLine = lines[0].trim()
        if (firstLine !== originalHeaders) {
          // Replace the first line with the original headers
          lines[0] = originalHeaders
          finalRawData = lines.join('\n')
        }
      }
    }
    
    // Update the table
    const parsedData = parseTableData(finalRawData)
    const displayData = getDisplayData(finalRawData, table.viewMode)
    const textareaData = table.viewMode === 'vertical' ? convertToVerticalFormat(finalRawData) : finalRawData
    
    setTables(tables.map((t, index) => (
      index === tableIndex 
        ? { ...t, rawData: finalRawData, textareaData, parsedData, displayData } 
        : t
    )))
  }

  const handleTextareaKeyDown = (tableIndex: number, e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const cursorPosition = textarea.selectionStart
    const value = textarea.value
    const table = tables[tableIndex]
    
    // Check for double spacebar (two consecutive spaces)
    if (e.key === ' ' && e.repeat === false) {
      // Get the character before the cursor
      const charBeforeCursor = value[cursorPosition - 1]
      
      if (charBeforeCursor === ' ') {
        // Double space detected - replace with tab
        e.preventDefault()
        
        // Replace the two spaces with a tab character
        const newValue = value.slice(0, cursorPosition - 1) + '\t' + value.slice(cursorPosition)
        
        // Update the table data based on view mode
        let finalRawData: string
        if (table.viewMode === 'vertical') {
          // In vertical mode, convert the vertical input back to horizontal format
          finalRawData = convertToHorizontalFormat(newValue)
      } else {
          // In horizontal mode, use the value directly
          finalRawData = newValue
}

        // Update the table
        const parsedData = parseTableData(finalRawData)
        const displayData = getDisplayData(finalRawData, table.viewMode)
        const textareaData = table.viewMode === 'vertical' ? convertToVerticalFormat(finalRawData) : finalRawData
        
        setTables(tables.map((t, index) => (index === tableIndex ? { 
          ...t, 
          rawData: finalRawData, 
          textareaData, 
          parsedData, 
          displayData 
        } : t)))
        
        // Set cursor position after the tab
        setTimeout(() => {
          textarea.setSelectionRange(cursorPosition, cursorPosition)
        }, 0)
      }
    }
  }

  const handleViewModeChange = (tableIndex: number, newViewMode: 'horizontal' | 'vertical') => {
    setTables(tables.map((table, index) => {
      if (index === tableIndex) {
        const displayData = getDisplayData(table.rawData, newViewMode)
        const textareaData = newViewMode === 'vertical' 
          ? convertToVerticalFormat(table.rawData) 
          : table.rawData
        
        return { 
          ...table, 
          viewMode: newViewMode, 
          displayData,
          textareaData
        }
      }
      return table
    }))
  }

  const toggleTableViewMode = (tableIndex: number) => {
    setTables(tables.map((table, index) => 
      index === tableIndex 
        ? { ...table, viewMode: table.viewMode === 'vertical' ? 'horizontal' : 'vertical' }
        : table
    ))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, contractDocument: file }))
    }
  }

  // Check if form can be submitted
  const canSubmit = () => {
    console.log("=== VALIDATION CHECK ===")
    console.log("Contract Name:", formData.contractName, "Empty:", !formData.contractName.trim())
    console.log("Contract Document:", formData.contractDocument, "Exists:", !!formData.contractDocument)
    
    // Check contract name
    if (!formData.contractName.trim()) {
      console.log("❌ Contract name is empty")
      return false
    }
    
    // Check contract document
    if (!formData.contractDocument) {
      console.log("❌ Contract document is missing")
      return false
    }
    
    console.log("✅ Form validation passed")
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // console.log("=== FORM SUBMISSION STARTED ===")
    // console.log("Form validation check:", canSubmit())

    if (!canSubmit()) {
      console.log("Form validation failed - cannot submit")
      alert("Please fill in all required fields.")
      return
    }

    try {
      // Create FormData to handle file upload
      const formDataToSend = new FormData()
      
      // Add contract name
      formDataToSend.append('contractName', formData.contractName)
      // console.log("Contract Name:", formData.contractName)
      
      // Add PDF file if selected
      if (formData.contractDocument) {
        formDataToSend.append('contractDocument', formData.contractDocument)
        console.log("Contract Document:", formData.contractDocument.name, "Size:", formData.contractDocument.size, "bytes")
      } else {
        // console.log("No contract document selected")
      }
      
      // Add emails
      const validEmails = emails.map((e) => e.email).filter((email) => email.trim() !== "")
      formDataToSend.append('emails', JSON.stringify(validEmails))
      console.log("Valid Emails:", validEmails)
      
      // Add tables data
      const tablesData = tables
        .filter((t) => t.rawData.trim() !== "")
        .map((t) => {
          // Get emails assigned to this table
          const assignedEmailIds = tableEmailMapping[t.id] || []
          const assignedEmails = assignedEmailIds
            .map((emailId) => {
              const emailObj = emails.find((e) => e.id === emailId)
              return emailObj?.email || ""
            })
            .filter((email) => email.trim() !== "")

          // Get CC emails assigned to this table
          const assignedCCEmailIds = tableCCEmailMapping[t.id] || []
          const assignedCCEmails = assignedCCEmailIds
            .map((emailId) => {
              const emailObj = emails.find((e) => e.id === emailId)
              return emailObj?.email || ""
            })
            .filter((email) => email.trim() !== "")

          // Always send data in horizontal format for backend processing
          const submissionData = getSubmissionData(t.rawData, t.viewMode)

          return {
            name: t.name,
            data: submissionData, // Use submission data instead of parsedData
            emailsAssigned: assignedEmails,
            ccEmailsAssigned: assignedCCEmails,
            viewMode: t.viewMode, // Send the actual view mode
          }
        })
      formDataToSend.append('tables', JSON.stringify(tablesData))
      
      // Add table names separately (these are now the structure names like "Product Inventory", "Employee Data", etc.)
      const tableNames = tables
        .filter((t) => t.rawData.trim() !== "")
        .map((t) => t.name)
      formDataToSend.append('tableNames', JSON.stringify(tableNames))
      console.log("Tables Data:", tablesData)
      console.log("Table Email Mapping:", tableEmailMapping)
      console.log("Table View Modes:", tables.map(t => ({ name: t.name, viewMode: t.viewMode })))

      // Log the complete FormData
      console.log("=== FORM DATA BEING SENT ===")
      for (let [key, value] of formDataToSend.entries()) {
        if (value instanceof File) {
          console.log(`${key}:`, value.name, "Size:", value.size, "bytes")
        } else {
          console.log(`${key}:`, value)
        }
      }

      const response = await fetch('https://gep1.app.n8n.cloud/webhook-test/send-form-data', {
        method: 'POST',
        body: formDataToSend, // Send FormData instead of JSON
      })

      console.log("Response Status:", response.status)
      console.log("Response Status Text:", response.statusText)
      console.log("Response Headers:", Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const responseText = await response.text()
        console.log("Response Body:", responseText)
        console.log("Form submitted successfully!")
        // Redirect to success page
        window.location.href = '/success'
      } else {
        const errorText = await response.text()
        console.error("Failed to submit form:")
        console.error("Status:", response.status)
        console.error("Status Text:", response.statusText)
        console.error("Error Response:", errorText)
        alert(`Failed to submit form. Status: ${response.status}\nError: ${errorText}`)
      }
    } catch (error) {
      console.error("Network/JavaScript Error submitting form:", error)
      console.error("Error details:", {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      alert(`Error submitting form: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="py-8">
        <div className="container mx-auto max-w-6xl px-4">
          <Card className="shadow-sm border border-blue-200 bg-white">
          <CardHeader className="bg-blue-100 border-b border-blue-200">
            <CardTitle className="text-2xl font-semibold text-blue-900 flex items-center gap-3">
              <Database className="w-6 h-6 text-blue-700" />
              Multi-Table Data Submission Form
            </CardTitle>
            <CardDescription className="text-blue-700">
              Enter your contract information, add multiple tables with Excel data, and map tables to specific email
              addresses
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Contract Information */}
              <Card className="border border-blue-200 bg-blue-50/30">
                <CardHeader className="pb-4 bg-white border-b border-blue-100">
                  <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Contract Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contractName" className="text-blue-800 font-medium">
                      Contract Name *
                    </Label>
                    <Input
                      id="contractName"
                      type="text"
                      placeholder="Enter contract name"
                      value={formData.contractName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, contractName: e.target.value }))}
                      required
                      className="border-2 border-blue-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus-visible:ring-blue-600/20 focus-visible:border-blue-600 focus-visible:outline-none bg-white autofill:bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contractDocument" className="text-blue-800 font-medium">
                      Contract Document *
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="contractDocument"
                        type="file"
                        onChange={handleFileUpload}
                        className="border-2 border-blue-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus-visible:ring-blue-600/20 focus-visible:border-blue-600 focus-visible:outline-none"
                        accept=".pdf,.doc,.docx"
                        required
                      />
                      <Upload className="w-5 h-5 text-blue-600" />
                    </div>
                    {formData.contractDocument && (
                      <p className="text-sm text-blue-700 bg-blue-100 p-2 rounded">
                        Selected: {formData.contractDocument.name}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Email Management */}
              <Card className="border border-blue-200 bg-blue-50/30">
                <CardHeader className="bg-white border-b border-blue-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-blue-600" />
                      Email Addresses
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addEmail}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100 bg-transparent"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Email
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {emails.map((emailData, index) => (
                      <div key={emailData.id} className="flex gap-2">
                        <Input
                          type="email"
                          placeholder={`Email ${index + 1}`}
                          value={emailData.email}
                          onChange={(e) => updateEmail(emailData.id, e.target.value)}
                          className="flex-1 border-2 border-blue-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus-visible:ring-blue-600/20 focus-visible:border-blue-600 focus-visible:outline-none bg-white autofill:bg-white"
                        />
                        {emails.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeEmail(emailData.id)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tables Management */}
              <Card className="border border-blue-200 bg-blue-50/30">
                <CardHeader className="bg-white border-b border-blue-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-600" />
                      Data Tables
                      <Badge variant="secondary" className="text-xs bg-slate-200 text-slate-600">
                        Optional
                      </Badge>
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addTable}
                      disabled={isLoadingStructures}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingStructures ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-1" />
                          Add Table
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {isLoadingStructures ? (
                    <div className="flex items-center justify-center h-32 text-blue-600">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      <p className="ml-2 text-sm">Loading table structures...</p>
                    </div>
                  ) : structureLoadError ? (
                    <div className="flex items-center justify-center h-32 text-red-600">
                      <XCircle className="w-8 h-8 text-red-600" />
                      <p className="ml-2 text-sm">{structureLoadError}</p>
                    </div>
                  ) : tables.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-blue-600">
                      <div className="text-center">
                        <Database className="w-12 h-12 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No tables added yet</p>
                        <p className="text-xs text-blue-500 mt-1">Click "Add Table" to get started</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {tables.map((table, tableIndex) => (
                        <Card key={table.id} className="border border-blue-300 bg-white shadow-sm">
                          <CardHeader className="bg-blue-50 border-b border-blue-200 pb-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="space-y-2">
                                  <div className="px-3 py-2 bg-blue-100 border-2 border-blue-300 rounded-md">
                                    <span className="font-medium text-blue-900">{table.name}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeTable(tableIndex)}
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-6 p-6">
                            {/* Email Mapping Display */}
                            <div className="space-y-3 p-4 rounded border bg-blue-100 border-blue-300">
                              <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2 text-blue-800 font-medium">
                                  <Link className="w-4 h-4 text-blue-600" />
                                  Mapped Emails
                                </Label>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditEmailsModal(table.id)}
                                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {(tableEmailMapping[table.id] || []).map((emailId) => {
                                  const emailObj = emails.find((e) => e.id === emailId)
                                  return emailObj?.email ? (
                                    <Badge key={`${table.id}-email-${emailId}`} variant="secondary" className="bg-blue-200 text-blue-800">
                                      {emailObj.email}
                                    </Badge>
                                  ) : null
                                })}
                              </div>
                            </div>

                            {/* CC Email Mapping Display */}
                            {(tableCCEmailMapping[table.id] || []).length > 0 && (
                              <div className="space-y-3 p-4 rounded border bg-green-100 border-green-300">
                                <div className="flex items-center justify-between">
                                  <Label className="flex items-center gap-2 text-green-800 font-medium">
                                    <Link className="w-4 h-4 text-green-600" />
                                    CC Emails
                                  </Label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditEmailsModal(table.id)}
                                    className="border-green-300 text-green-600 hover:bg-green-50"
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Edit
                                  </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {(tableCCEmailMapping[table.id] || []).map((emailId) => {
                                    const emailObj = emails.find((e) => e.id === emailId)
                                    return emailObj?.email ? (
                                      <Badge key={`${table.id}-cc-${emailId}`} variant="secondary" className="bg-green-200 text-green-800">
                                        {emailObj.email}
                                      </Badge>
                                    ) : null
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Table Data Input and Preview - Side by Side */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Input Section */}
                              <div className="space-y-3">
                                <Label className="text-blue-800 font-medium">
                                  Paste Excel Data
                                  {table.viewMode === 'horizontal' && (
                                    <Badge variant="secondary" className="ml-2 bg-green-200 text-green-800 text-xs">
                                      Double space for tab
                                    </Badge>
                                  )}
                                </Label>
                                <div className="relative">
                                  <Textarea
                                    placeholder="Copy and paste your Excel data here... (Double space to add tab separator)"
                                    value={table.textareaData}
                                    onChange={(e) => handleTableDataChange(tableIndex, e.target.value)}
                                    onKeyDown={(e) => handleTextareaKeyDown(tableIndex, e)}
                                    className="min-h-[300px] font-mono text-sm resize-none border-2 border-blue-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus-visible:ring-blue-600/20 focus-visible:border-blue-600 focus-visible:outline-none bg-blue-50/20"
                                  />
                                </div>
                              </div>

                              {/* Preview Section */}
                              <div className="space-y-3">
                                <Label className="text-blue-800 font-medium">
                                  Preview{" "}
                                  {table.displayData.length > 0 && (
                                    <Badge variant="secondary" className="ml-2 bg-blue-200 text-blue-800">
                                      {table.viewMode === 'vertical' 
                                        ? `${table.displayData[0]?.length - 1 || 0} rows` 
                                        : `${table.displayData.length-1} rows`
                                      }
                                    </Badge>
                                  )}
                                </Label>
                                <div className="border border-blue-300 rounded h-[300px] overflow-auto bg-white">
                                  {table.displayData.length > 0 ? (
                                    table.viewMode === 'vertical' ? (
                                      // Vertical View - Transposed Table with first column as headers
                                      <Table>
                                        <TableBody>
                                          {table.displayData.map((row, rowIndex) => (
                                            <TableRow key={rowIndex} className="hover:bg-blue-50 border-b border-blue-100">
                                              {row.map((cell, cellIndex) => (
                                                <TableCell
                                                  key={cellIndex}
                                                  className={`${cellIndex === 0 
                                                    ? 'font-semibold text-blue-800 bg-blue-100 border-r border-blue-200' 
                                                    : 'text-blue-900 border-r border-blue-200'} px-4 py-2 max-w-xs truncate`}
                                                >
                                                  {cell || (cellIndex === 0 ? `Row ${rowIndex + 1}` : "")}
                                                </TableCell>
                                              ))}
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    ) : (
                                      // Horizontal View with first row as headers
                                      <Table>
                                        <TableHeader>
                                          <TableRow className="bg-blue-100">
                                            {table.displayData[0]?.map((header, index) => (
                                              <TableHead
                                                key={index}
                                                className="font-semibold text-blue-800 sticky top-0 bg-blue-100 border-b border-blue-200 border-r border-blue-200 px-4 py-2"
                                              >
                                                {header || `Column ${index + 1}`}
                                              </TableHead>
                                            ))}
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {table.displayData.slice(1).map((row, rowIndex) => (
                                            <TableRow key={rowIndex} className="hover:bg-blue-50 border-b border-blue-100">
                                              {row.map((cell, cellIndex) => (
                                                <TableCell
                                                  key={cellIndex}
                                                  className="max-w-xs truncate text-blue-900 border-r border-blue-200 px-4 py-2"
                                                >
                                                  {cell}
                                                </TableCell>
                                              ))}
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    )
                                  ) : (
                                    <div className="flex items-center justify-center h-full text-blue-600">
                                      <p className="text-center">
                                        <Database className="w-12 h-12 mx-auto mb-2 opacity-40" />
                                        Paste Excel data to see preview
                                      </p>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Radio Button Selection for View Mode */}
                                {table.displayData.length > 0 && (
                                  <div className="flex justify-center items-center gap-4 p-3 bg-blue-50 rounded border border-blue-200">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="radio"
                                        name={`viewMode-${tableIndex}`}
                                        value="horizontal"
                                        checked={table.viewMode === 'horizontal'}
                                        onChange={() => handleViewModeChange(tableIndex, 'horizontal')}
                                        className="text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="text-blue-800 font-medium">Horizontal View</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="radio"
                                        name={`viewMode-${tableIndex}`}
                                        value="vertical"
                                        checked={table.viewMode === 'vertical'}
                                        onChange={() => handleViewModeChange(tableIndex, 'vertical')}
                                        className="text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="text-blue-800 font-medium">Vertical View</span>
                                    </label>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mapping Summary - Only show if there are mappings */}
              {Object.keys(tableEmailMapping).some((tableId) =>
                tableEmailMapping[tableId]?.some((emailId) => {
                  const emailObj = emails.find((e) => e.id === emailId)
                  return emailObj?.email?.trim() !== ""
                }),
              ) && (
                <Card className="border border-blue-200 bg-blue-50/50">
                  <CardHeader className="bg-white border-b border-blue-100">
                    <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                      <Link className="w-5 h-5 text-blue-600" />
                      Table-Email Mapping Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {tables.map((table) => {
                        const emailIds = tableEmailMapping[table.id] || []
                        const mappedEmails = emailIds
                          .map((emailId) => {
                            const emailObj = emails.find((e) => e.id === emailId)
                            return emailObj?.email || ""
                          })
                          .filter((email) => email.trim() !== "")

                        const ccEmailIds = tableCCEmailMapping[table.id] || []
                        const mappedCCEmails = ccEmailIds
                          .map((emailId) => {
                            const emailObj = emails.find((e) => e.id === emailId)
                            return emailObj?.email || ""
                          })
                          .filter((email) => email.trim() !== "")

                        if (mappedEmails.length === 0 && mappedCCEmails.length === 0) return null

                        return (
                          <div key={table.id} className="p-3 bg-white rounded border border-blue-200">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="border-blue-400 text-blue-800 bg-blue-100">
                                {table.name}
                              </Badge>
                              <span className="text-blue-600 font-medium">→</span>
                              <div className="flex flex-wrap gap-2">
                                {mappedEmails.map((email, index) => (
                                  <Badge key={`${table.id}-main-${index}`} variant="secondary" className="text-xs bg-blue-200 text-blue-800">
                                    {email}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            {/* CC Emails - on next line */}
                            {mappedCCEmails.length > 0 && (
                              <div className="flex items-center gap-3 mt-2">
                                <Badge variant="outline" className="border-green-400 text-green-800 bg-green-100 text-xs">
                                  CC
                                </Badge>
                                <span className="text-green-600 font-medium">→</span>
                                <div className="flex flex-wrap gap-2">
                                  {mappedCCEmails.map((email, index) => (
                                    <Badge key={`${table.id}-cc-${index}`} variant="secondary" className="text-xs bg-green-200 text-green-800">
                                      {email}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-6">
                <Button
                  type="submit"
                  disabled={!canSubmit()}
                  className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    console.log("Submit button clicked!")
                    console.log("Button disabled:", !canSubmit())
                  }}
                >
                  Submit Form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Table Creation Modal */}
        {showTableCreationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-blue-900">Create New Table</h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTableCreationModal(false)
                    setNewTableName("")
                    setSelectedTableStructure("")
                    setSelectedEmailsForNewTable([])
                  }}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* Table Structure Selection */}
                <div className="space-y-3">
                  <Label htmlFor="table-structure" className="text-blue-800 font-medium">
                    Select Table Structure *
                  </Label>
                  {isLoadingStructures ? (
                    <div className="flex items-center gap-2 p-3 border border-blue-300 rounded-md bg-blue-50">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-sm text-blue-700">Loading table structures...</span>
                    </div>
                  ) : structureLoadError ? (
                    <div className="flex items-center gap-2 p-3 border border-red-300 rounded-md bg-red-50">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-700">Error loading structures: {structureLoadError}</span>
                    </div>
                  ) : (
                    <Select value={selectedTableStructure} onValueChange={handleTableStructureSelection}>
                      <SelectTrigger className="border-2 border-blue-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20">
                        <SelectValue placeholder="Choose a table structure..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableTableStructures().map((structure) => (
                          <SelectItem key={structure.name} value={structure.name}>
                            <div className="flex items-center gap-2">
                              <CopyIcon className="w-4 h-4" />
                              {structure.name}
                              <Badge variant="secondary" className="ml-auto text-xs">
                                {structure.columns.length} columns
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Email Selection */}
                <div className="space-y-3">
                  <Label className="text-blue-800 font-medium">
                    Select Emails to Map *
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {emails.filter(e => e.email.trim() !== "").map((emailData, index) => {
                      const isSelectedInMain = selectedEmailsForNewTable.includes(emailData.id)
                      const isSelectedInCC = selectedCCEmailsForNewTable.includes(emailData.id)
                      
                      return (
                        <Button
                          key={emailData.id}
                          type="button"
                          variant={isSelectedInMain ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleEmailSelectionForNewTable(emailData.id)}
                          disabled={isSelectedInCC}
                          className={
                            isSelectedInMain
                              ? "bg-blue-600 hover:bg-blue-700 text-white border-0"
                              : isSelectedInCC
                              ? "border-gray-300 text-gray-400 cursor-not-allowed bg-gray-100"
                              : "border-blue-400 text-blue-800 hover:bg-blue-200"
                          }
                        >
                          {emailData.email}
                        </Button>
                      )
                    })}
                  </div>
                  {emails.filter(e => e.email.trim() !== "").length === 0 && (
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                      No valid email addresses available. Please add at least one email address.
                    </p>
                  )}
                </div>

                {/* CC Email Selection */}
                <div className="space-y-3">
                  <Label className="text-blue-800 font-medium">
                    Select Emails to CC
                    <Badge variant="secondary" className="ml-2 bg-green-200 text-green-800 text-xs">
                      Optional
                    </Badge>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {emails.filter(e => e.email.trim() !== "").map((emailData, index) => {
                      const isSelectedInMain = selectedEmailsForNewTable.includes(emailData.id)
                      const isSelectedInCC = selectedCCEmailsForNewTable.includes(emailData.id)
                      
                      return (
                        <Button
                          key={emailData.id}
                          type="button"
                          variant={isSelectedInCC ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleCCEmailSelectionForNewTable(emailData.id)}
                          disabled={isSelectedInMain}
                          className={
                            isSelectedInCC
                              ? "bg-green-600 hover:bg-green-700 text-white border-0"
                              : isSelectedInMain
                              ? "border-gray-300 text-gray-400 cursor-not-allowed bg-gray-100"
                              : "border-green-400 text-green-800 hover:bg-green-200"
                          }
                        >
                          {emailData.email}
                        </Button>
                      )
                    })}
                  </div>
                  {emails.filter(e => e.email.trim() !== "").length === 0 && (
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                      No valid email addresses available for CC selection.
                    </p>
                  )}
                </div>

                {/* Preview Selected Structure */}
                {selectedTableStructure && (
                  <div className="space-y-3">
                    <Label className="text-blue-800 font-medium">
                      Preview Structure
                    </Label>
                    <div className="border border-blue-300 rounded-lg overflow-hidden bg-white">
                      <div className="max-h-64 overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-blue-100">
                              {getAvailableTableStructures().find(s => s.name === selectedTableStructure)?.columns.map((column, index) => (
                                <TableHead
                                  key={index}
                                  className="font-semibold text-blue-800 sticky top-0 bg-blue-100 border-b border-blue-200 border-r border-blue-200 px-4 py-2"
                                >
                                  {column}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getAvailableTableStructures().find(s => s.name === selectedTableStructure)?.sampleData?.map((row, rowIndex) => (
                              <TableRow key={rowIndex} className="hover:bg-blue-50 border-b border-blue-100">
                                {getAvailableTableStructures().find(s => s.name === selectedTableStructure)?.columns.map((column, cellIndex) => (
                                  <TableCell
                                    key={cellIndex}
                                    className="max-w-xs truncate text-blue-900 border-r border-blue-200 px-4 py-2"
                                  >
                                    {row[column] || ""}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowTableCreationModal(false)
                      setNewTableName("")
                      setSelectedTableStructure("")
                      setSelectedEmailsForNewTable([])
                    }}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createTableFromStructure}
                    disabled={!selectedTableStructure || selectedEmailsForNewTable.length === 0 || isLoadingStructures}
                    className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingStructures ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Create Table"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Emails Modal */}
        {showEditEmailsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-blue-800">
                    Edit Emails for "{editingTableName}"
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowEditEmailsModal(false)
                      setEditingTableName("")
                      setSelectedEmailsForEdit([])
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <Label className="text-blue-800 font-medium">
                    Select Emails to Map *
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {emails.filter(e => e.email.trim() !== "").map((emailData, index) => {
                      const isSelectedInMain = selectedEmailsForEdit.includes(emailData.id)
                      const isSelectedInCC = selectedCCEmailsForEdit.includes(emailData.id)
                      
                      return (
                        <Button
                          key={emailData.id}
                          type="button"
                          variant={isSelectedInMain ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleEmailSelectionForEdit(emailData.id)}
                          disabled={isSelectedInCC}
                          className={
                            isSelectedInMain
                              ? "bg-blue-600 hover:bg-blue-700 text-white border-0"
                              : isSelectedInCC
                              ? "border-gray-300 text-gray-400 cursor-not-allowed bg-gray-100"
                              : "border-blue-400 text-blue-800 hover:bg-blue-200"
                          }
                        >
                          {emailData.email}
                        </Button>
                      )
                    })}
                  </div>
                  {emails.filter(e => e.email.trim() !== "").length === 0 && (
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                      No valid email addresses available. Please add at least one email address.
                    </p>
                  )}
                </div>

                {/* CC Email Selection */}
                <div className="space-y-3">
                  <Label className="text-blue-800 font-medium">
                    Select Emails to CC
                    <Badge variant="secondary" className="ml-2 bg-green-200 text-green-800 text-xs">
                      Optional
                    </Badge>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {emails.filter(e => e.email.trim() !== "").map((emailData, index) => {
                      const isSelectedInMain = selectedEmailsForEdit.includes(emailData.id)
                      const isSelectedInCC = selectedCCEmailsForEdit.includes(emailData.id)
                      
                      return (
                        <Button
                          key={emailData.id}
                          type="button"
                          variant={isSelectedInCC ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleCCEmailSelectionForEdit(emailData.id)}
                          disabled={isSelectedInMain}
                          className={
                            isSelectedInCC
                              ? "bg-green-600 hover:bg-green-700 text-white border-0"
                              : isSelectedInMain
                              ? "border-gray-300 text-gray-400 cursor-not-allowed bg-gray-100"
                              : "border-green-400 text-green-800 hover:bg-green-200"
                          }
                        >
                          {emailData.email}
                        </Button>
                      )
                    })}
                  </div>
                  {emails.filter(e => e.email.trim() !== "").length === 0 && (
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                      No valid email addresses available for CC selection.
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditEmailsModal(false)
                      setEditingTableName("")
                      setSelectedEmailsForEdit([])
                    }}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveEditedEmails}
                    disabled={selectedEmailsForEdit.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
