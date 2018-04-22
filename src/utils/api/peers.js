import { loadingStarted, loadingFinished } from '../../utils/loading';

// eslint-disable-next-line import/prefer-default-export
export const requestToActivePeer = (activePeer, path, urlParams) =>
  new Promise((resolve, reject) => {
    loadingStarted(path);
    activePeer.sendRequest(path, urlParams, (data) => {
      if (data.success) {
        resolve(data);
      } else {
        reject(data);
      }
      loadingFinished(path);
    });
  });

export const popsicleToActivePeer = (activePeer, url, requestValue) =>
  new Promise((resolve, reject) => {
    loadingStarted(url);
    activePeer.doPopsicleRequest(requestValue)
      .then((data) => {
        if (data.body.success) {
          resolve(data.body);
        } else {
          reject(data.body);
        }
        loadingFinished(url);
      });
  });
