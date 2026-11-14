import { Component, signal, OnInit, HostListener } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
interface Offer {
  id: string;
  buyer: string;
  alias: string;
  amount: number;
}
interface Item {
  _id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
  condition: string;
  alias: string;
  seller: string;
  status: string;
  offers?: Offer[];
  buyer?: string;
}
@Component({
  selector: "app-root",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./app.html",
})
class App implements OnInit {
  items = signal<Item[]>([]);
  workspace = signal<Item[]>([]);
  selected = signal<Item | null>(null);
  messages = signal<any[]>([]);
  session = signal<any>(null);
  notice = signal("");
  busy = signal(false);
  panel = signal("");
  category = "";
  query = "";
  mode = "login";
  email = "";
  password = "";
  alias = "";
  offer = 0;
  content = "";
  buyer = "";
  draft = {
    title: "",
    description: "",
    price: 0,
    category: "Living",
    condition: "Good",
    image: "",
  };
  @HostListener("document:keydown", ["$event"]) keyboard(e: KeyboardEvent) {
    if (!this.panel()) return;
    if (e.key === "Escape") {
      this.panel.set("");
      return;
    }
    if (e.key === "Tab") {
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".panel button:not([disabled]),.panel input,.panel textarea,.panel select",
        ),
      );
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  }
  async ngOnInit() {
    try {
      const saved = sessionStorage.getItem("jugaad-session");
      if (saved) this.session.set(JSON.parse(saved));
    } catch {}
    await this.load();
  }
  money(p: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(p / 100);
  }
  async api(path: string, method = "GET", body?: unknown) {
    const response = await fetch("/api" + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(this.session()
          ? { Authorization: "Bearer " + this.session().token }
          : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401) this.logout();
      throw Error(data.error || "Please try again");
    }
    return data;
  }
  async run(fn: () => Promise<void>) {
    if (this.busy()) return;
    this.busy.set(true);
    this.notice.set("");
    try {
      await fn();
    } catch (e: any) {
      this.notice.set(e.message || "Unable to connect. Please try again.");
    } finally {
      this.busy.set(false);
    }
  }
  async load() {
    await this.run(async () =>
      this.items.set(
        await this.api(
          "/items?category=" +
            encodeURIComponent(this.category) +
            "&q=" +
            encodeURIComponent(this.query),
        ),
      ),
    );
  }
  async filter(value: string) {
    this.category = value;
    await this.load();
  }
  open(panel: string) {
    this.notice.set("");
    this.panel.set(!this.session() && panel !== "auth" ? "auth" : panel);
    setTimeout(() =>
      document
        .querySelector<HTMLElement>(".panel input,.panel button")
        ?.focus(),
    );
  }
  async login() {
    await this.run(async () => {
      const u = await this.api("/auth/" + this.mode, "POST", {
        email: this.email,
        password: this.password,
        alias: this.alias,
      });
      this.session.set(u);
      sessionStorage.setItem("jugaad-session", JSON.stringify(u));
      this.password = "";
      this.panel.set("");
    });
  }
  logout() {
    this.session.set(null);
    sessionStorage.removeItem("jugaad-session");
    this.workspace.set([]);
    this.messages.set([]);
    this.panel.set("");
  }
  async publish() {
    await this.run(async () => {
      await this.api("/items", "POST", {
        ...this.draft,
        price: Math.round(this.draft.price * 100),
      });
      this.panel.set("");
      this.items.set(await this.api("/items"));
      this.notice.set("Your listing is live.");
    });
  }
  choose(item: Item) {
    this.selected.set(item);
    this.offer = item.price / 100;
    this.buyer = "";
    this.messages.set([]);
    this.panel.set("item");
    this.notice.set("");
  }
  async bid() {
    if (!this.session()) {
      this.open("auth");
      return;
    }
    await this.run(async () => {
      await this.api("/items/" + this.selected()!._id + "/offers", "POST", {
        amount: Math.round(this.offer * 100),
      });
      this.notice.set("Offer sent. Follow it in My exchanges.");
    });
  }
  async exchanges() {
    if (!this.session()) {
      this.open("auth");
      return;
    }
    await this.run(async () => {
      this.workspace.set(await this.api("/workspace"));
      this.panel.set("workspace");
    });
  }
  async accept(item: Item, offer: Offer) {
    await this.run(async () => {
      await this.api("/items/" + item._id + "/accept/" + offer.id, "POST", {});
      this.workspace.set(await this.api("/workspace"));
      this.items.set(await this.api("/items"));
      this.notice.set(
        "Offer accepted. Arrange collection in your conversation.",
      );
    });
  }
  chat(item: Item, buyer = "") {
    this.choose(item);
    this.buyer = buyer;
    this.readMessages();
  }
  async readMessages() {
    if (!this.session()) return;
    await this.run(async () =>
      this.messages.set(
        await this.api(
          "/messages/" +
            this.selected()!._id +
            (this.buyer ? "?buyer=" + this.buyer : ""),
        ),
      ),
    );
  }
  async send() {
    await this.run(async () => {
      await this.api(
        "/messages/" +
          this.selected()!._id +
          (this.buyer ? "?buyer=" + this.buyer : ""),
        "POST",
        { content: this.content },
      );
      this.content = "";
      this.messages.set(
        await this.api(
          "/messages/" +
            this.selected()!._id +
            (this.buyer ? "?buyer=" + this.buyer : ""),
        ),
      );
    });
  }
}
bootstrapApplication(App).catch(console.error);
