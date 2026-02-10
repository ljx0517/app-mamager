import UIKit
import SwiftUI

/// 键盘扩展主控制器
class KeyboardViewController: UIInputViewController {
    
    // MARK: - Properties
    
    private var hostingController: UIHostingController<KeyboardMainView>?
    private let clipboardService = KeyboardClipboardHelper()
    
    // MARK: - Lifecycle
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupKeyboardView()
    }
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        // 键盘出现时开始持续监听剪贴板
        clipboardService.startMonitoring()
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        // 键盘消失时停止监听，节省资源
        clipboardService.stopMonitoring()
    }
    
    override func textDidChange(_ textInput: UITextInput?) {
        super.textDidChange(textInput)
        // 用户切换输入框时也检查一次剪贴板
        clipboardService.checkClipboard()
    }
    
    // MARK: - Setup
    
    private func setupKeyboardView() {
        let subscriptionStatus = SubscriptionStatus.loadFromAppGroup()
        
        let keyboardView = KeyboardMainView(
            clipboardHelper: clipboardService,
            subscriptionStatus: subscriptionStatus,
            onInsertText: { [weak self] text in
                self?.textDocumentProxy.insertText(text)
            },
            onDeleteBackward: { [weak self] in
                self?.textDocumentProxy.deleteBackward()
            },
            onSwitchKeyboard: { [weak self] in
                self?.advanceToNextInputMode()
            }
        )
        
        let hostingVC = UIHostingController(rootView: keyboardView)
        hostingVC.view.translatesAutoresizingMaskIntoConstraints = false
        hostingVC.view.backgroundColor = UIColor.clear
        
        addChild(hostingVC)
        view.addSubview(hostingVC.view)
        hostingVC.didMove(toParent: self)
        
        NSLayoutConstraint.activate([
            hostingVC.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            hostingVC.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            hostingVC.view.topAnchor.constraint(equalTo: view.topAnchor),
            hostingVC.view.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            hostingVC.view.heightAnchor.constraint(equalToConstant: 300)
        ])
        
        self.hostingController = hostingVC
    }
}
