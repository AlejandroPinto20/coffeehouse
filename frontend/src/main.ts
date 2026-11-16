import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpClient, HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { bootstrapApplication, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

interface Section { slug: string; nav_label: string; eyebrow: string; title: string; description: string }
interface Photo { id: number; photo_url: string; photo_alt: string }
interface Product extends Photo { name: string; description: string; price: string; featured: number; category_id: number }
interface Site {
  profile: { name: string; location: string; address: string; phone: string; hours: string; story: string;
    demo_notice: string; video_url: string; poster_url: string; video_credit_url: string };
  texts: Record<string, string>;
  sections: Section[];
  services: { id: number; icon: string; name: string; description: string }[];
  categories: { id: number; name: string }[];
  products: Product[];
  gallery: Photo[];
}
interface Message { role: 'user' | 'assistant'; content: string }

@Component({
  selector: 'app-root',
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './app.html'
})
class CoffeeHouse {
  private readonly http = inject(HttpClient);
  private readonly title = inject(Title);
  readonly site = signal<Site | null>(null);
  readonly loadError = signal(false);
  readonly menuOpen = signal(false);
  readonly playing = signal(false);
  readonly reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  readonly category = signal<number | null>(null);
  readonly filtered = computed(() => this.site()?.products.filter(product =>
    this.category() === null || product.category_id === this.category()) ?? []);
  readonly featured = computed(() => this.site()?.products.filter(product => product.featured) ?? []);
  readonly contact = { name: '', email: '', message: '' };
  readonly contactStatus = signal('');
  readonly submitting = signal(false);
  readonly chatOpen = signal(false);
  readonly messages = signal<Message[]>([]);
  readonly chatPending = signal(false);
  readonly chatStatus = signal('');
  question = '';
  readonly icons: Record<string, string> = { cup: '♨', pastry: '♧', bag: '◇', table: '⌂' };

  constructor() {
    const motionChange = () => {
      if (this.reducedMotion.matches) document.querySelector<HTMLVideoElement>('.hero-video')?.pause();
    };
    this.reducedMotion.addEventListener('change', motionChange);
    inject(DestroyRef).onDestroy(() => this.reducedMotion.removeEventListener('change', motionChange));
    void this.load();
  }

  async load() {
    this.loadError.set(false);
    try {
      const data = await firstValueFrom(this.http.get<Site>('/api/site'));
      this.site.set(data);
      this.title.setTitle(data.profile.name);
    } catch {
      this.loadError.set(true);
    }
  }

  async toggleVideo(video: HTMLVideoElement) {
    if (!video.paused) {
      video.pause();
      return;
    }
    try { await video.play(); } catch { this.playing.set(false); }
  }

  async sendContact() {
    if (this.submitting()) return;
    this.contactStatus.set('');
    this.submitting.set(true);
    try {
      const response = await firstValueFrom(this.http.post<{ code: string }>('/api/contact', this.contact));
      this.contactStatus.set(response.code);
      Object.assign(this.contact, { name: '', email: '', message: '' });
    } catch (error) {
      this.contactStatus.set(this.errorCode(error, 'retry'));
    } finally {
      this.submitting.set(false);
    }
  }

  async sendChat(log: HTMLElement) {
    const content = this.question.trim();
    if (!content || this.chatPending()) return;
    const history = [...this.messages().slice(-8), { role: 'user' as const, content }];
    this.chatStatus.set('');
    this.chatPending.set(true);
    this.messages.update(messages => [...messages, history[history.length - 1]]);
    this.question = '';
    try {
      const { reply } = await firstValueFrom(this.http.post<{ reply: string }>('/api/chat', { messages: history }));
      this.messages.update(messages => [...messages, { role: 'assistant', content: reply }]);
    } catch (error) {
      this.messages.update(messages => messages.slice(0, -1));
      this.question = content;
      this.chatStatus.set(this.errorCode(error, 'chatUnavailable'));
    } finally {
      this.chatPending.set(false);
      requestAnimationFrame(() => log.scrollTop = log.scrollHeight);
    }
  }

  private errorCode(error: unknown, fallback: string) {
    const code: unknown = error instanceof HttpErrorResponse ? error.error?.code : undefined;
    const texts = this.site()?.texts;
    return typeof code === 'string' && texts && Object.hasOwn(texts, code) ? code : fallback;
  }
}

bootstrapApplication(CoffeeHouse, { providers: [provideHttpClient()] }).catch(console.error);
