import * as XLSX from 'xlsx'

/**
 * 导出数据到 Excel 文件
 * @param {Array} jsonData - 要导出的 JSON 数组数据
 * @param {String} fileName - 导出的文件名（不含扩展名）
 */
export const exportToExcel = (jsonData, fileName = 'export') => {
  try {
    // 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(jsonData)
    
    // 创建工作簿
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
    
    // 导出文件
    XLSX.writeFile(workbook, `${fileName}.xlsx`)
    
    return true
  } catch (error) {
    console.error('导出 Excel 失败:', error)
    return false
  }
}

/**
 * 导出数据到 Excel 文件（自定义列）
 * @param {Array} jsonData - 要导出的 JSON 数组数据
 * @param {Array} columns - 列配置 [{key: 'id', label: 'ID'}, ...]
 * @param {String} fileName - 导出的文件名（不含扩展名）
 */
export const exportToExcelWithColumns = (jsonData, columns, fileName = 'export') => {
  try {
    // 转换数据：只保留指定的列，并使用中文表头
    const transformedData = jsonData.map(item => {
      const newItem = {}
      columns.forEach(col => {
        newItem[col.label] = item[col.key]
      })
      return newItem
    })
    
    // 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(transformedData)
    
    // 创建工作簿
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
    
    // 导出文件
    XLSX.writeFile(workbook, `${fileName}.xlsx`)
    
    return true
  } catch (error) {
    console.error('导出 Excel 失败:', error)
    return false
  }
}

