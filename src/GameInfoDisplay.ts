import { GameConfig } from './GameConfig';

/**
 * GameInfoDisplay - Shows general game information at the top of the screen
 */
export class GameInfoDisplay {
    private infoElement: HTMLElement;
    private daysPassed: number = 0;
    private totalDayTime: number = 0;

    constructor() {
        this.infoElement = this.createInfoElement();
        document.body.appendChild(this.infoElement);
    }

    /**
     * Create the info display HTML element
     */
    private createInfoElement(): HTMLElement {
        const info = document.createElement('div');
        info.id = 'game-info-display';
        info.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(44, 62, 80, 0.92);
            border: 3px solid #3498db;
            border-radius: 12px;
            padding: 15px 30px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
            z-index: 900;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            gap: 30px;
            align-items: center;
            backdrop-filter: blur(8px);
        `;

        return info;
    }

    /**
     * Update the display with current game information
     */
    public update(timeInCycle: number, config: GameConfig, deltaTime: number): void {
        // Track total time and calculate days passed
        this.totalDayTime += deltaTime;
        const cycleDuration = config.dayDurationSeconds;
        this.daysPassed = Math.floor(this.totalDayTime / cycleDuration);

        // Clear previous content
        this.infoElement.innerHTML = '';

        // Days passed
        const daysInfo = this.createInfoItem('🌅 Days Passed', this.daysPassed.toString(), '#f39c12');
        this.infoElement.appendChild(daysInfo);

        // Current time of day
        const timeOfDay = config.getTimeOfDayString(timeInCycle);
        const timeColor = config.isDaytime(timeInCycle) ? '#3498db' : '#9b59b6';
        const timeIcon = config.isDaytime(timeInCycle) ? '☀️' : '🌙';
        const timeInfo = this.createInfoItem(`${timeIcon} Time`, timeOfDay, timeColor);
        this.infoElement.appendChild(timeInfo);

        // Sun energy (only show during day)
        if (config.isDaytime(timeInCycle)) {
            const sunEnergy = config.calculateSunEnergy(timeInCycle);
            const sunPercent = ((sunEnergy / config.maxSunEnergyEmission) * 100).toFixed(0);
            const sunInfo = this.createInfoItem('☀️ Sun Energy', `${sunPercent}%`, '#e67e22');
            this.infoElement.appendChild(sunInfo);
        }

        // Cycle progress bar
        const cycleProgress = (timeInCycle / cycleDuration) * 100;
        const progressBar = this.createCycleProgressBar(cycleProgress, config.isDaytime(timeInCycle));
        this.infoElement.appendChild(progressBar);
    }

    /**
     * Create an info item display
     */
    private createInfoItem(label: string, value: string, color: string): HTMLElement {
        const item = document.createElement('div');
        item.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
        `;

        const labelSpan = document.createElement('div');
        labelSpan.textContent = label;
        labelSpan.style.cssText = `
            font-size: 12px;
            color: #bdc3c7;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;

        const valueSpan = document.createElement('div');
        valueSpan.textContent = value;
        valueSpan.style.cssText = `
            font-size: 20px;
            font-weight: 700;
            color: ${color};
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        `;

        item.appendChild(labelSpan);
        item.appendChild(valueSpan);

        return item;
    }

    /**
     * Create a progress bar showing day/night cycle progress
     */
    private createCycleProgressBar(progress: number, isDaytime: boolean): HTMLElement {
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
            min-width: 200px;
        `;

        const label = document.createElement('div');
        label.textContent = '⏰ Cycle Progress';
        label.style.cssText = `
            font-size: 12px;
            color: #bdc3c7;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;

        const barBg = document.createElement('div');
        barBg.style.cssText = `
            width: 200px;
            height: 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;

        const barFill = document.createElement('div');
        const gradient = isDaytime 
            ? 'linear-gradient(90deg, #3498db, #f39c12)' 
            : 'linear-gradient(90deg, #9b59b6, #2c3e50)';
        
        barFill.style.cssText = `
            width: ${progress}%;
            height: 100%;
            background: ${gradient};
            transition: width 0.3s ease;
            box-shadow: 0 0 8px ${isDaytime ? '#3498db' : '#9b59b6'};
        `;

        barBg.appendChild(barFill);
        container.appendChild(label);
        container.appendChild(barBg);

        return container;
    }

    /**
     * Reset days counter
     */
    public resetDays(): void {
        this.daysPassed = 0;
        this.totalDayTime = 0;
    }

    /**
     * Get current days passed count
     */
    public getDaysPassed(): number {
        return this.daysPassed;
    }
}
