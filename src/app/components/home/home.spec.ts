import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SoundService } from '../../services/sound';
import { Home } from './home';

describe('Home', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        { provide: SoundService, useValue: { enter: vi.fn(), click: vi.fn() } },
      ],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(Home);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render one card per API', async () => {
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.card');
    expect(cards.length).toBe(2);
  });

  it('should link to both explorers', async () => {
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const hrefs = Array.from(compiled.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/pokedex');
    expect(hrefs).toContain('/rick-and-morty');
  });

  it('should play the enter sound of the target API theme on click', () => {
    const fixture = TestBed.createComponent(Home);
    const sound = TestBed.inject(SoundService) as unknown as { enter: ReturnType<typeof vi.fn> };
    const component = fixture.componentInstance;

    component.onEnter(component.apis[0]);
    expect(sound.enter).toHaveBeenCalledWith('pokemon');

    component.onEnter(component.apis[1]);
    expect(sound.enter).toHaveBeenCalledWith('portal');
  });
});
