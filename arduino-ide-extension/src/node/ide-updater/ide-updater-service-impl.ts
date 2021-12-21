import { injectable } from '@theia/core/shared/inversify';
import { GenericServerOptions } from 'builder-util-runtime';
import {
  AppUpdater,
  AppImageUpdater,
  MacUpdater,
  NsisUpdater,
  UpdateInfo,
  CancellationToken,
} from 'electron-updater';
import {
  IDEUpdaterService,
  IDEUpdaterServiceClient,
} from '../../common/protocol/ide-updater-service';

// IDEUpdater TODO docs
@injectable()
export class IDEUpdaterServiceImpl implements IDEUpdaterService {
  private updater: AppUpdater;
  private cancellationToken?: CancellationToken;
  protected theiaFEClient?: IDEUpdaterServiceClient;

  constructor() {
    const options: GenericServerOptions = {
      provider: 'generic',
      url: 'https://downloads.arduino.cc/arduino-ide/nightly/test/',
      channel: 'beta',
    };

    this.cancellationToken = new CancellationToken();
    if (process.platform === 'win32') {
      this.updater = new NsisUpdater(options);
    } else if (process.platform === 'darwin') {
      this.updater = new MacUpdater(options);
    } else {
      this.updater = new AppImageUpdater(options);
    }
    this.updater.autoDownload = false;

    this.updater.on('checking-for-update', (e) =>
      this.theiaFEClient?.notifyCheckingForUpdate(e)
    );
    this.updater.on('update-available', (e) =>
      this.theiaFEClient?.notifyUpdateAvailable(e)
    );
    this.updater.on('update-not-available', (e) =>
      this.theiaFEClient?.notifyUpdateNotAvailable(e)
    );
    this.updater.on('download-progress', (e) =>
      this.theiaFEClient?.notifyDownloadFinished(e)
    );
    this.updater.on('update-downloaded', (e) =>
      this.theiaFEClient?.notifyDownloadFinished(e)
    );
    this.updater.on('error', (e) => this.theiaFEClient?.notifyError(e));
  }

  setClient(client: IDEUpdaterServiceClient | undefined): void {
    this.theiaFEClient = client;
  }

  dispose(): void {
    throw new Error('Method not implemented.');
  }

  async checkForUpdates(): Promise<UpdateInfo> {
    const { updateInfo } = await this.updater.checkForUpdates();
    return updateInfo;
  }

  async downloadUpdate(): Promise<void> {
    await this.updater.downloadUpdate(this.cancellationToken);
  }

  stopDownload(): void {
    this.cancellationToken?.cancel();
  }

  quitAndInstall(): void {
    this.updater.quitAndInstall();
  }
}
