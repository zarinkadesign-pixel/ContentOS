"""Producer Center — Main App Window (fixed)"""
import customtkinter as ctk
from config import BG, NAV, TEXT, ACCENT

ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

class App(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("Producer Center — AMAImedia")
        self.geometry("1280x800")
        self.minsize(1000, 650)
        self.configure(fg_color=BG)
        self._active_client_id = None
        self._screens = {}
        self._build_layout()
        self.show_screen("dashboard")

    def _build_layout(self):
        from ui.sidebar import Sidebar
        self.sidebar = Sidebar(self, on_navigate=self.show_screen)
        self.sidebar.pack(side="left", fill="y")
        self.content = ctk.CTkFrame(self, fg_color=BG, corner_radius=0)
        self.content.pack(side="left", fill="both", expand=True)

    def show_screen(self, name: str):
        # Hide all
        for w in self.content.winfo_children():
            w.pack_forget()

        # Create if needed
        if name not in self._screens:
            self._screens[name] = self._make_screen(name)

        screen = self._screens[name]

        # Refresh data
        if hasattr(screen, "refresh"):
            try:
                screen.refresh()
            except Exception as e:
                print(f"Refresh error on {name}: {e}")

        screen.pack(fill="both", expand=True)
        self.sidebar.set_active(name)

    def _make_screen(self, name: str):
        if name == "dashboard":
            from ui.dashboard import DashboardScreen
            return DashboardScreen(self.content, self)
        elif name == "crm":
            from ui.crm import CRMScreen
            return CRMScreen(self.content, self)
        elif name == "clients":
            from ui.clients import ClientsScreen
            return ClientsScreen(self.content, self)
        elif name == "profile":
            from ui.client_profile import ClientProfileScreen
            return ClientProfileScreen(self.content, self)
        elif name == "products":
            from ui.products import ProductsScreen
            return ProductsScreen(self.content, self)
        elif name == "content":
            from ui.vizard_pipeline import VizardScreen
            return VizardScreen(self.content, self)
        elif name == "finance":
            from ui.finance import FinanceScreen
            return FinanceScreen(self.content, self)
        else:
            f = ctk.CTkFrame(self.content, fg_color=BG)
            ctk.CTkLabel(f, text=f"📋 {name}",
                         font=("Inter",24,"bold"), text_color=TEXT).pack(pady=40)
            return f

    def open_client(self, client_id: int):
        """Open client profile — always recreate to load fresh data"""
        self._active_client_id = client_id
        if "profile" in self._screens:
            del self._screens["profile"]
        self.show_screen("profile")

    def get_active_client_id(self):
        return self._active_client_id
