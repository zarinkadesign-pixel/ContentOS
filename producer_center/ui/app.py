"""Producer Center — Main App Window"""
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

        self._build_layout()
        self.show_screen("dashboard")

    def _build_layout(self):
        from ui.sidebar import Sidebar
        self.sidebar = Sidebar(self, on_navigate=self.show_screen)
        self.sidebar.pack(side="left", fill="y")

        self.content_frame = ctk.CTkFrame(self, fg_color=BG, corner_radius=0)
        self.content_frame.pack(side="left", fill="both", expand=True)

        self._screens = {}

    def show_screen(self, name: str):
        # lazy-load screens
        if name not in self._screens:
            self._screens[name] = self._create_screen(name)

        for w in self.content_frame.winfo_children():
            w.pack_forget()

        screen = self._screens[name]
        if hasattr(screen, "refresh"):
            screen.refresh()
        screen.pack(fill="both", expand=True)
        self.sidebar.set_active(name)

    def _create_screen(self, name: str):
        if name == "dashboard":
            from ui.dashboard import DashboardScreen
            return DashboardScreen(self.content_frame, self)
        elif name == "crm":
            from ui.crm import CRMScreen
            return CRMScreen(self.content_frame, self)
        elif name == "clients":
            from ui.clients import ClientsScreen
            return ClientsScreen(self.content_frame, self)
        elif name == "profile":
            from ui.client_profile import ClientProfileScreen
            return ClientProfileScreen(self.content_frame, self)
        elif name == "products":
            from ui.products import ProductsScreen
            return ProductsScreen(self.content_frame, self)
        elif name == "content":
            from ui.vizard_pipeline import VizardScreen
            return VizardScreen(self.content_frame, self)
        elif name == "finance":
            from ui.finance import FinanceScreen
            return FinanceScreen(self.content_frame, self)
        elif name == "agents":
            from ui.agents import AgentsScreen
            return AgentsScreen(self.content_frame, self)
        elif name == "calls":
            from ui.calls import CallsScreen
            return CallsScreen(self.content_frame, self)
        else:
            f = ctk.CTkFrame(self.content_frame, fg_color=BG)
            ctk.CTkLabel(f, text=f"📋 {name}", font=("Inter",24,"bold"), text_color=TEXT).pack(pady=40)
            return f

    def open_client(self, client_id: int):
        self._active_client_id = client_id
        if "profile" in self._screens:
            del self._screens["profile"]
        self.show_screen("profile")

    def get_active_client_id(self):
        return getattr(self, "_active_client_id", None)
