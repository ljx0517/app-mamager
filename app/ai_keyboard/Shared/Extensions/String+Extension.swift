import Foundation

extension String {
    /// 去除首尾空白和换行
    var trimmed: String {
        trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    /// 是否为空或仅包含空白字符
    var isBlank: Bool {
        trimmed.isEmpty
    }
    
    /// 截断字符串到指定长度
    func truncated(to maxLength: Int, trailing: String = "...") -> String {
        if count <= maxLength {
            return self
        }
        return String(prefix(maxLength)) + trailing
    }
    
    /// 用于剪贴板内容的简要预览
    var clipboardPreview: String {
        let cleaned = self
            .replacingOccurrences(of: "\n", with: " ")
            .trimmed
        return cleaned.truncated(to: 100)
    }
}
